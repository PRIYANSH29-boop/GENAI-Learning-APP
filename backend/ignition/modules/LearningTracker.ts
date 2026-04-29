import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LearningTrackerModule = buildModule("LearningTrackerModule", (m) => {
  const learningTracker = m.contract("LearningTracker");

  return { learningTracker };
});

export default LearningTrackerModule;