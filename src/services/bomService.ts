import { HardwareComponent, ComponentCategory } from "../types";

export interface PowerBudgetReport {
  totalEstimatedCurrentMA: number;
  continuousDrawMA: number;
  peakDrawMA: number;
  estimatedBatteryRunHours: number;
  recommendedBatteryCapacity: string;
}

export interface PinUsageReport {
  usedGPIO: number;
  totalAvailableGPIO: number;
  usedPWM: number;
  usedI2C: number;
  usedSPI: number;
  usedUART: number;
  isConstrained: boolean;
  pinoutSummary: string;
}

export const CONTROLLER_CATEGORIES: ReadonlySet<ComponentCategory> = new Set([
  "Microcontroller",
  "SBC",
  "SOM / Compute",
  "SOM / FPGA & MPSoC",
  "SOM / AI Accelerator",
  "Robot Platform"
]);

/**
 * Checks if a component category represents a main brain / controller
 */
export function isPrimaryControllerCategory(category: string): boolean {
  return CONTROLLER_CATEGORIES.has(category as ComponentCategory);
}

/**
 * Handles adding a component to the active BOM drawer according to robotics engineering rules
 */
export function addComponentToDrawer(
  currentDrawer: HardwareComponent[],
  component: HardwareComponent,
  activeMCU: HardwareComponent
): {
  updatedDrawer: HardwareComponent[];
  updatedMCU: HardwareComponent;
  message: string;
  success: boolean;
} {
  // If component is a primary controller or SOM, replace the active MCU
  if (isPrimaryControllerCategory(component.category)) {
    const updatedDrawer = currentDrawer
      .filter((c) => !isPrimaryControllerCategory(c.category))
      .concat(component);

    return {
      updatedDrawer,
      updatedMCU: component,
      message: `Selected ${component.name} as primary controller.`,
      success: true
    };
  }

  // Check duplicate
  if (currentDrawer.some((c) => c.id === component.id)) {
    return {
      updatedDrawer: currentDrawer,
      updatedMCU: activeMCU,
      message: `${component.name} is already in your build.`,
      success: false
    };
  }

  return {
    updatedDrawer: [...currentDrawer, component],
    updatedMCU: activeMCU,
    message: `Added ${component.name} to build drawer.`,
    success: true
  };
}

/**
 * Handles removing a component from the active BOM drawer safely
 */
export function removeComponentFromDrawer(
  currentDrawer: HardwareComponent[],
  componentId: string,
  activeMCU: HardwareComponent
): {
  updatedDrawer: HardwareComponent[];
  message: string;
  success: boolean;
} {
  const target = currentDrawer.find((c) => c.id === componentId);
  if (!target) {
    return { updatedDrawer: currentDrawer, message: "Component not found.", success: false };
  }

  if (target.id === activeMCU.id) {
    return {
      updatedDrawer: currentDrawer,
      message: "Primary controller cannot be removed directly. Select another controller to replace it.",
      success: false
    };
  }

  return {
    updatedDrawer: currentDrawer.filter((c) => c.id !== componentId),
    message: `Removed ${target.name} from drawer.`,
    success: true
  };
}

/**
 * Calculates estimated power budget across configured components
 */
export function calculatePowerBudget(
  components: HardwareComponent[],
  batteryCapacityMAh: number = 2200
): PowerBudgetReport {
  let continuousMA = 0;
  let peakMA = 0;

  for (const comp of components) {
    const cat = comp.category;
    const name = comp.name.toLowerCase();

    if (cat === "Microcontroller") {
      continuousMA += 80;
      peakMA += 240; // Wi-Fi TX burst
    } else if (cat === "SBC" || cat === "SOM / Compute" || cat === "SOM / AI Accelerator") {
      if (name.includes("orin") || name.includes("jetson")) {
        continuousMA += 2000;
        peakMA += 3500;
      } else if (name.includes("pi 4") || name.includes("pi 5")) {
        continuousMA += 1200;
        peakMA += 2500;
      } else {
        continuousMA += 800;
        peakMA += 1500;
      }
    } else if (cat === "Actuator") {
      if (name.includes("mg996r") || name.includes("high torque")) {
        continuousMA += 250;
        peakMA += 1800;
      } else if (name.includes("sg90")) {
        continuousMA += 100;
        peakMA += 500;
      } else {
        continuousMA += 150;
        peakMA += 800;
      }
    } else if (cat === "Motor Driver") {
      continuousMA += 40;
      peakMA += 150;
    } else if (cat === "Sensor") {
      if (name.includes("lidar")) {
        continuousMA += 350;
        peakMA += 600;
      } else if (name.includes("camera")) {
        continuousMA += 200;
        peakMA += 350;
      } else {
        continuousMA += 15;
        peakMA += 30;
      }
    } else {
      continuousMA += 10;
      peakMA += 20;
    }
  }

  const avgDrawMA = Math.max(50, Math.round(continuousMA * 0.7 + peakMA * 0.3));
  const safeCapacity = batteryCapacityMAh * 0.85; // 85% usable battery efficiency
  const runHours = Math.round((safeCapacity / avgDrawMA) * 10) / 10;

  let recommendedBattery = "7.4V 2S LiPo (2200mAh 25C)";
  if (continuousMA > 2000) {
    recommendedBattery = "11.1V 3S LiPo (3300mAh 45C) + 5V 5A UBEC Step-Down";
  } else if (continuousMA < 300) {
    recommendedBattery = "Dual 18650 Li-ion cells (7.4V 2600mAh) or 5V 2A USB Power Bank";
  }

  return {
    totalEstimatedCurrentMA: avgDrawMA,
    continuousDrawMA: continuousMA,
    peakDrawMA: peakMA,
    estimatedBatteryRunHours: runHours,
    recommendedBatteryCapacity: recommendedBattery
  };
}

/**
 * Calculates estimated GPIO and communication bus utilization
 */
export function calculatePinUsage(
  components: HardwareComponent[],
  mcu: HardwareComponent
): PinUsageReport {
  let usedGPIO = 0;
  let usedPWM = 0;
  let usedI2C = 0;
  let usedSPI = 0;
  let usedUART = 0;

  for (const comp of components) {
    if (comp.id === mcu.id) continue;
    const iface = (comp.interface || "").toLowerCase();
    const cat = comp.category;

    if (iface.includes("i2c")) usedI2C++;
    if (iface.includes("spi")) usedSPI++;
    if (iface.includes("uart")) usedUART++;
    if (iface.includes("pwm") || cat === "Actuator") usedPWM += 1;

    // Approximate GPIO pins required
    if (cat === "Sensor") {
      if (iface.includes("i2c")) usedGPIO += 2; // SDA, SCL
      else if (comp.name.toLowerCase().includes("hcsr04")) usedGPIO += 2; // Trig, Echo
      else usedGPIO += 1;
    } else if (cat === "Motor Driver") {
      if (iface.includes("i2c")) usedGPIO += 2;
      else usedGPIO += 4; // IN1, IN2, IN3, IN4 or ENA/ENB
    } else if (cat === "Actuator") {
      usedGPIO += 1;
    }
  }

  // Estimated available pins based on controller
  let totalAvailableGPIO = 26;
  const mcuName = mcu.name.toLowerCase();
  if (mcuName.includes("teensy 4.1")) totalAvailableGPIO = 42;
  else if (mcuName.includes("esp32-s3")) totalAvailableGPIO = 36;
  else if (mcuName.includes("esp32")) totalAvailableGPIO = 24;
  else if (mcuName.includes("uno r4")) totalAvailableGPIO = 14;
  else if (mcuName.includes("raspberry pi 4") || mcuName.includes("pi 5")) totalAvailableGPIO = 28;
  else if (mcuName.includes("orin") || mcuName.includes("jetson")) totalAvailableGPIO = 28;

  const isConstrained = usedGPIO > totalAvailableGPIO * 0.85;

  return {
    usedGPIO,
    totalAvailableGPIO,
    usedPWM,
    usedI2C,
    usedSPI,
    usedUART,
    isConstrained,
    pinoutSummary: `${usedGPIO}/${totalAvailableGPIO} GPIO Pins Assigned (${usedI2C} I2C device${usedI2C > 1 ? 's' : ''}, ${usedPWM} PWM channel${usedPWM > 1 ? 's' : ''})`
  };
}

/**
 * Checks for missing critical robotics subsystems
 */
export function findMissingSubsystems(components: HardwareComponent[]): string[] {
  const categories = new Set(components.map((c) => c.category));
  const missing: string[] = [];

  const hasController = components.some((c) => isPrimaryControllerCategory(c.category));
  if (!hasController) missing.push("Primary Controller (Microcontroller / SBC)");

  if (!categories.has("Power Supply")) {
    missing.push("Power Source (Battery pack, LiPo, or DC-DC regulator)");
  }

  if (!categories.has("Actuator") && !categories.has("Chassis")) {
    missing.push("Motion / Actuation (Motors, Servos, or Drive Chassis)");
  }

  return missing;
}
