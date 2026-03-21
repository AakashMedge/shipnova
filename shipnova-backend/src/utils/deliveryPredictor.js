// Delivery prediction engine - estimates ETA based on stage durations and history

const STAGE_BASELINES = {
  Created: { toNext: 24, label: "Awaiting Pickup" },
  "Picked Up": { toNext: 12, label: "In Sorting Queue" },
  "At Sorting Facility": { toNext: 18, label: "Preparing Dispatch" },
  "In Transit": { toNext: 36, label: "En Route to Destination" },
  "Out for Delivery": { toNext: 6, label: "Last Mile Delivery" },
  Delivered: { toNext: 0, label: "Completed" },
  "Failed / Retry / Returned": { toNext: 48, label: "Under Review" },
};

const STATUS_ORDER = ["Created", "Picked Up", "At Sorting Facility", "In Transit", "Out for Delivery", "Delivered"];

const getRemainingHours = (currentStatus) => {
  const idx = STATUS_ORDER.indexOf(currentStatus);
  if (idx === -1 || currentStatus === "Delivered") return 0;
  let total = 0;
  for (let i = idx; i < STATUS_ORDER.length - 1; i++) {
    total += STAGE_BASELINES[STATUS_ORDER[i]]?.toNext || 12;
  }
  return total;
};

const getConfidence = (currentStatus, lastUpdated) => {
  const hoursSinceUpdate = (Date.now() - new Date(lastUpdated)) / (1000 * 60 * 60);
  const baseline = STAGE_BASELINES[currentStatus]?.toNext || 24;

  if (currentStatus === "Delivered") return { level: "Confirmed", score: 100 };
  if (currentStatus === "Out for Delivery") return { level: "High", score: 92 };
  if (currentStatus === "In Transit") {
    return hoursSinceUpdate < baseline * 0.7 ? { level: "High", score: 85 } : { level: "Medium", score: 68 };
  }
  if (hoursSinceUpdate > baseline * 1.5) return { level: "Low", score: 42 };
  return { level: "Medium", score: 71 };
};

const predictDelivery = (shipment) => {
  const { status, updatedAt, history, createdAt } = shipment;

  if (status === "Delivered") {
    return {
      estimatedDelivery: updatedAt,
      estimatedDeliveryLabel: "Delivered",
      confidence: { level: "Confirmed", score: 100 },
      stageDurationHours: 0,
      basis: "Package delivered.",
      stageLabel: "Completed",
      remainingStages: 0,
    };
  }

  if (status === "Failed / Retry / Returned") {
    return {
      estimatedDelivery: null,
      estimatedDeliveryLabel: "Under Review",
      confidence: { level: "Low", score: 30 },
      stageDurationHours: null,
      basis: "Delivery exception. Awaiting re-routing.",
      stageLabel: "Exception",
      remainingStages: null,
    };
  }

  let adjustedHours = getRemainingHours(status);

  if (history && history.length > 1) {
    const firstEvent = new Date(history[0]?.timestamp || createdAt);
    const lastEvent = new Date(history[history.length - 1]?.timestamp || updatedAt);
    const totalElapsed = (lastEvent - firstEvent) / (1000 * 60 * 60);
    const stagesCompleted = Math.max(history.length - 1, 1);
    const actualRate = totalElapsed / stagesCompleted;
    const remainingStages = STATUS_ORDER.length - 1 - STATUS_ORDER.indexOf(status);
    const blendedRate = 0.6 * (adjustedHours / Math.max(remainingStages, 1)) + 0.4 * actualRate;
    adjustedHours = blendedRate * Math.max(remainingStages, 1);
  }

  const estimatedMs = Date.now() + adjustedHours * 60 * 60 * 1000;
  const estimatedDelivery = new Date(estimatedMs);
  const confidence = getConfidence(status, updatedAt);
  const remainingStages = STATUS_ORDER.length - 1 - STATUS_ORDER.indexOf(status);

  const isToday = new Date(estimatedDelivery).toDateString() === new Date().toDateString();
  const isTomorrow = new Date(estimatedDelivery).toDateString() === new Date(Date.now() + 86400000).toDateString();
  const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : estimatedDelivery.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return {
    estimatedDelivery,
    estimatedDeliveryLabel: dateLabel,
    confidence,
    stageDurationHours: Math.round(adjustedHours),
    basis: `Predicted from ${history?.length || 1} tracking events and benchmarks.`,
    stageLabel: STAGE_BASELINES[status]?.label || "Processing",
    remainingStages,
  };
};

module.exports = { predictDelivery };
