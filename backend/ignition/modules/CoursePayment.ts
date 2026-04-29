import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CoursePaymentModule = buildModule("CoursePaymentModule", (m) => {
  const coursePayment = m.contract("CoursePayment");
  return { coursePayment };
});

export default CoursePaymentModule;
