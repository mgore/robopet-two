import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { HardwareComponent } from "../types";
import { calculateBaseHardwareCost, getShippingCost, getToolsCost, getTrainingCost } from "./costService";

export interface ExportPdfOptions {
  exportMode: "budget" | "wiring" | "full";
  robotType: string;
  customGoal: string;
  budget: number;
  activeMCU: HardwareComponent;
  activeDrawer: HardwareComponent[];
  shippingTier: "standard" | "express" | "economy";
  includeToolsEst: boolean;
  includeTrainingEst: boolean;
}

/**
 * Builds standard Workshop Mobile sync URL
 */
export function buildWorkshopSyncUrl(
  robotType: string,
  budget: number,
  activeDrawer: HardwareComponent[],
  view: "budget" | "wiring" | "full" = "budget"
): string {
  if (typeof window === "undefined") return "";
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const partIds = activeDrawer.map((item) => item.id).join(",");
  const params = new URLSearchParams({
    robotType,
    budget: budget.toString(),
    parts: partIds,
    view,
    mode: "workshop"
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Downloads QR Code PNG for workbench use
 */
export async function downloadQRCodePNG(syncUrl: string, robotType: string): Promise<boolean> {
  try {
    const dataUrl = await QRCode.toDataURL(syncUrl, { width: 500, margin: 2 });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `AIRoboPet_${robotType}_Workshop_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error("QR Download error:", err);
    return false;
  }
}

/**
 * Exports current project build to local JSON file ($0 cloud cost)
 */
export function exportProjectToJSON(data: {
  robotType: string;
  budget: number;
  customGoal: string;
  activeDrawer: HardwareComponent[];
  contingencyList: HardwareComponent[];
}): string {
  const payload = {
    appName: "AI RoboPet",
    robotType: data.robotType,
    budget: data.budget,
    customGoal: data.customGoal,
    activeDrawer: data.activeDrawer,
    contingencyList: data.contingencyList,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const filename = `AIRoboPet_${data.robotType}_build.json`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
}

/**
 * Validates and parses local project JSON file
 */
export function parseProjectJSON(content: string): {
  valid: boolean;
  data?: {
    robotType?: string;
    budget?: number;
    customGoal?: string;
    activeDrawer?: HardwareComponent[];
    contingencyList?: HardwareComponent[];
  };
  error?: string;
} {
  try {
    const parsed = JSON.parse(content);
    if (parsed.activeDrawer && Array.isArray(parsed.activeDrawer)) {
      return {
        valid: true,
        data: {
          robotType: parsed.robotType,
          budget: Number(parsed.budget) || undefined,
          customGoal: parsed.customGoal,
          activeDrawer: parsed.activeDrawer,
          contingencyList: Array.isArray(parsed.contingencyList) ? parsed.contingencyList : []
        }
      };
    }
    return { valid: false, error: "Invalid AI RoboPet JSON build file structure." };
  } catch {
    return { valid: false, error: "Failed to parse JSON project file." };
  }
}

export const generateWorkshopSyncUrl = (
  activeDrawer: HardwareComponent[],
  robotType: string,
  budget: number,
  _origin?: string
) => buildWorkshopSyncUrl(robotType, budget, activeDrawer);

export const exportProjectJSON = (
  activeDrawer: HardwareComponent[],
  contingencyList: HardwareComponent[],
  robotType: string,
  customGoal: string,
  budget: number
) => {
  return JSON.stringify(
    {
      appName: "AI RoboPet",
      robotType,
      budget,
      customGoal,
      activeDrawer,
      contingencyList,
      exportedAt: new Date().toISOString()
    },
    null,
    2
  );
};

export const parseWorkshopSyncUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const robotType = parsedUrl.searchParams.get("robotType") || undefined;
    const budget = parsedUrl.searchParams.get("budget") ? Number(parsedUrl.searchParams.get("budget")) : undefined;
    const parts = parsedUrl.searchParams.get("parts")?.split(",").filter(Boolean) || [];
    return { robotType, budget, parts };
  } catch {
    return null;
  }
};

/**
 * Generates and downloads professional PDF specification sheet
 */
export async function exportDrawerToPDF(options: ExportPdfOptions): Promise<string> {
  const {
    exportMode,
    robotType,
    customGoal,
    budget,
    activeMCU,
    activeDrawer,
    shippingTier,
    includeToolsEst,
    includeTrainingEst
  } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const baseHardwareCost = calculateBaseHardwareCost(activeDrawer);
  const shippingCost = getShippingCost(shippingTier);
  const toolsCost = getToolsCost(includeToolsEst);
  const trainingCost = getTrainingCost(includeTrainingEst);
  const grandTotalCost = baseHardwareCost + shippingCost + toolsCost + trainingCost;
  const budgetExceeded = grandTotalCost > budget;

  const syncUrl = buildWorkshopSyncUrl(robotType, budget, activeDrawer, exportMode);
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(syncUrl, { margin: 1, width: 120 });
  } catch (err) {
    console.warn("QR code data URL generation error:", err);
  }

  // Color palette definitions - refined for high contrast and clean professional printing
  const PRIMARY_COLOR = [15, 23, 42]; // Deep slate (#0f172a)
  const ACCENT_CYAN = [14, 116, 144]; // Deep teal/cyan (#0e7490)
  const ACCENT_PURPLE = [126, 34, 206]; // Deep purple (#7e22ce)
  const TEXT_DARK = [30, 41, 59]; // Near black (#1e293b)
  const TEXT_MUTED = [100, 116, 139]; // Slate grey (#64748b)
  const BG_LIGHT = [248, 250, 252]; // Warm off-white (#f8fafc)
  const LINE_COLOR = [226, 232, 240]; // Light grey border (#e2e8f0)

  const margin = 18;
  const pageWidth = 210;
  const formattedRobotType = robotType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const renderHeader = (docTitle: string, docSubtitle: string, accentRgb = ACCENT_CYAN) => {
    doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.rect(0, 0, pageWidth, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text("AI ROBOPET", margin, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(docSubtitle, margin, 25);

    const rightAlignX = qrDataUrl ? pageWidth - margin - 23 : pageWidth - margin;

    doc.setFontSize(8);
    doc.text(`Generated: ${today}`, rightAlignX, 19, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.text(docTitle.toUpperCase(), rightAlignX, 24, { align: "right" });

    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 21, 6, 21, 21);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(5);
        doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
        doc.text("SCAN FOR MOBILE SYNC", pageWidth - margin - 10.5, 29, { align: "center" });
      } catch {
        // fallback gracefully
      }
    }

    doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, 31, pageWidth - margin, 31);
  };

  const formatProtocolLabel = (protoStr: string): string => {
    if (!protoStr) return "General Purpose I/O (GPIO)";
    return protoStr.trim();
  };

  // 1. BUDGET VIEW
  const renderBudgetView = (startY: number) => {
    let y = startY;
    const cardHeight = 36;
    doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
    doc.rect(margin, y, pageWidth - 2 * margin, cardHeight, "F");
    doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
    doc.rect(margin, y, pageWidth - 2 * margin, cardHeight, "S");

    doc.setFillColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
    doc.rect(margin, y, 2.5, cardHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text("AI ROBOPET SPECIFICATIONS & SYSTEM PROFILE", margin + 5, y + 6);

    // Row 1: Robot Archetype & Target Budget Cap & Budget Status & Bill of Materials
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("Robot Archetype:", margin + 5, y + 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(formattedRobotType, margin + 33, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("Target Budget:", margin + 76, y + 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(`$${budget}.00 USD`, margin + 98, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("Modules:", margin + 126, y + 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(`${activeDrawer.length} Configured`, margin + 140, y + 12);

    // Row 2: Active Controller (Reformatted font and full-width placement to display all text without clipping)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("Active Controller:", margin + 5, y + 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    const controllerText = `${activeMCU.name} (${activeMCU.voltage}) • ${activeMCU.specs || "Standard MCU"}`;
    const controllerLines = doc.splitTextToSize(controllerText, pageWidth - 2 * margin - 35);
    doc.text(controllerLines[0], margin + 33, y + 18);

    // Row 3: Primary Objective (Category at margin + 5, bold text starting at margin + 33 in alignment with the category)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("Primary Objective:", margin + 5, y + 24.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    const goalLines = doc.splitTextToSize(customGoal, pageWidth - 2 * margin - 35);
    doc.text(goalLines, margin + 33, y + 24.5);

    y += cardHeight + 6;

    // BOM Section Header Banner
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
    doc.setFillColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
    doc.rect(margin, y, 2.5, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text("BILL OF MATERIALS (BOM) & SUPPLIER SOURCING SPECIFICATIONS", margin + 5, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(`${activeDrawer.length} ACTIVE MODULES CONFIGURED`, pageWidth - margin - 5, y + 5.5, { align: "right" });

    y += 11;

    const renderBudgetTableHeader = (currY: number) => {
      doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.rect(margin, currY, pageWidth - 2 * margin, 12, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("COMPONENT / HARDWARE MODULE", margin + 4, currY + 4.5);
      doc.text("MANUFACTURER & CATEGORY", margin + 85, currY + 4.5);

      doc.setFontSize(6.5);
      doc.setTextColor(241, 245, 249);
      doc.text("PROTOCOL / BUS INTERFACE", margin + 4, currY + 9.5);
      doc.text("HARDWARE SPECIFICATIONS & PARAMETERS", margin + 54, currY + 9.5);
      doc.text("EST. COST ($)", pageWidth - margin - 4, currY + 9.5, { align: "right" });

      return currY + 12;
    };

    y = renderBudgetTableHeader(y);

    activeDrawer.forEach((comp, idx) => {
      const fullProto = formatProtocolLabel(comp.interface);
      const fullSpecs = comp.specs.trim() || "Standard OEM robotics hardware component.";
      const priceText = `$${comp.estimatedPriceUSD}.00 USD`;

      const protoLines = doc.splitTextToSize(fullProto, 46);
      const specLines = doc.splitTextToSize(fullSpecs, 88);
      const maxLines = Math.max(protoLines.length, specLines.length, 1);

      const primaryHeight = 6.5;
      const extensionHeight = 4.5 + maxLines * 3.6;
      const totalItemHeight = primaryHeight + extensionHeight;

      if (y + totalItemHeight > 260) {
        doc.addPage();
        renderHeader("Project Budget & BOM Report (Cont.)", "Financial breakdown and supplier inventory analysis (Continued)", ACCENT_CYAN);
        y = 35;
        y = renderBudgetTableHeader(y);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
        doc.rect(margin, y, pageWidth - 2 * margin, totalItemHeight, "F");
      }

      doc.setFillColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
      doc.rect(margin, y, 1.2, totalItemHeight, "F");

      // 1. PRIMARY ROW
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(comp.name, margin + 4, y + 4.8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text(`Mfg: ${comp.manufacturer || "OEM Catalog"} • Category: ${comp.category}`, margin + 85, y + 4.8);

      doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
      doc.setLineWidth(0.15);
      doc.line(margin + 3, y + primaryHeight, pageWidth - margin - 3, y + primaryHeight);

      // 2. EXTENSION ROW BELOW
      const extY = y + primaryHeight;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.text("PROTOCOL:", margin + 4, extY + 3.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(protoLines, margin + 4, extY + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.text("KEY SPECIFICATIONS:", margin + 54, extY + 3.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(specLines, margin + 54, extY + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.text("EST. COST:", pageWidth - margin - 4, extY + 3.5, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(priceText, pageWidth - margin - 4, extY + 8, { align: "right" });

      doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
      doc.setLineWidth(0.25);
      doc.line(margin, y + totalItemHeight, pageWidth - margin, y + totalItemHeight);

      y += totalItemHeight;
    });

    if (y + 55 > 270) {
      doc.addPage();
      renderHeader("Project Budget & BOM Report (Cont.)", "Financial breakdown and investment analysis (Continued)", ACCENT_CYAN);
      y = 35;
    }

    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");
    doc.setFillColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
    doc.rect(margin, y, 2.5, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text("ADDITIONAL PROJECT INVESTMENT ITEMIZATION", margin + 5, y + 4.8);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text("1. Hardware Parts Subtotal", margin + 5, y);
    doc.text(`$${baseHardwareCost}.00 USD`, pageWidth - margin - 4, y, { align: "right" });
    y += 5;

    doc.text(`2. Estimated Shipping & Handling (${shippingTier.toUpperCase()} Delivery)`, margin + 5, y);
    doc.text(`$${shippingCost}.00 USD`, pageWidth - margin - 4, y, { align: "right" });
    y += 5;

    doc.text(`3. Tools & Assembly Equipment (Soldering Iron, Multimeter, Wire Cutters, Screws)`, margin + 5, y);
    doc.text(`$${toolsCost}.00 USD`, pageWidth - margin - 4, y, { align: "right" });
    y += 5;

    doc.text(`4. AI Neural Training & Compute Runtime (Physics Sim GPU & LLM Credits)`, margin + 5, y);
    doc.text(`$${trainingCost}.00 USD`, pageWidth - margin - 4, y, { align: "right" });
    y += 7;

    doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
    doc.rect(margin, y, pageWidth - 2 * margin, 8.5, "F");
    doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
    doc.rect(margin, y, pageWidth - 2 * margin, 8.5, "S");

    doc.setFillColor(ACCENT_CYAN[0], ACCENT_CYAN[1], ACCENT_CYAN[2]);
    doc.rect(margin, y, 2.5, 8.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text("Estimated Overall Project Cost", margin + 5, y + 5.5);
    doc.text(`$${grandTotalCost}.00 USD`, pageWidth - margin - 4, y + 5.5, { align: "right" });

    y += 12;
    doc.setFillColor(240, 253, 244);
    doc.rect(margin, y, pageWidth - 2 * margin, 20, "F");
    doc.setDrawColor(187, 247, 208);
    doc.rect(margin, y, pageWidth - 2 * margin, 20, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text("SUPPLY CHAIN SECURITY & NATO-ALIGNED AUDIT VERDICT", margin + 5, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("Hardware Origin: 100% US & NATO-Aligned Authorized Vendors (DigiKey, Mouser, SparkFun, Adafruit, Pololu)", margin + 5, y + 11);
    doc.text("Software Stack: 100% Open-Source C++/Python/ROS 2 (Zero proprietary telemetry or mandatory third-party mobile app locks)", margin + 5, y + 16);

    return y + 25;
  };

  // 2. WIRING VIEW
  const renderWiringView = (startY: number) => {
    let y = startY;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageWidth - 2 * margin, 24, "F");
    doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
    doc.rect(margin, y, pageWidth - 2 * margin, 24, "S");
    doc.setFillColor(ACCENT_PURPLE[0], ACCENT_PURPLE[1], ACCENT_PURPLE[2]);
    doc.rect(margin, y, 2.5, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(`MASTER CONTROLLER PINOUT CONFIGURATION — ${activeMCU.name.toUpperCase()}`, margin + 5, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(`Operating Voltage: ${activeMCU.voltage}`, margin + 5, y + 12);
    doc.text(`Supported Bus Protocols: I2C (SDA/SCL), SPI (MOSI/MISO), Hardware UART (TX/RX), Multi-channel PWM`, margin + 5, y + 17);
    doc.text(`Note: All modules MUST share a unified common Ground (GND) reference rail across power supplies.`, margin + 5, y + 22);

    y += 29;

    const nonMCUComponents = activeDrawer.filter((c) => c.category !== "Microcontroller" && c.category !== "SBC");
    const listToMap = nonMCUComponents.length > 0 ? nonMCUComponents : activeDrawer;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
    doc.setFillColor(ACCENT_PURPLE[0], ACCENT_PURPLE[1], ACCENT_PURPLE[2]);
    doc.rect(margin, y, 2.5, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text("HARDWARE CIRCUIT CONNECTIONS & PINOUT MAPPING", margin + 5, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(`${listToMap.length} SIGNAL CONNECTIONS`, pageWidth - margin - 5, y + 5.5, { align: "right" });

    y += 11;

    const renderWiringTableHeader = (currY: number) => {
      doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.rect(margin, currY, pageWidth - 2 * margin, 12, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("MODULE / SENSOR NAME", margin + 4, currY + 4.5);
      doc.text("MODULE TERMINAL & TARGET MCU PIN", margin + 85, currY + 4.5);

      doc.setFontSize(6.5);
      doc.setTextColor(241, 245, 249);
      doc.text("PROTOCOL / BUS INTERFACE", margin + 4, currY + 9.5);
      doc.text("CIRCUIT WIRING NOTES & HARDWARE PARAMETERS", margin + 54, currY + 9.5);
      doc.text("EST. COST ($)", pageWidth - margin - 4, currY + 9.5, { align: "right" });

      return currY + 12;
    };

    y = renderWiringTableHeader(y);

    listToMap.forEach((comp, idx) => {
      let pin = "Signal / Out";
      let mcuPort = `GPIO ${idx + 4}`;
      let protocol = comp.interface || "GPIO";
      let note = "Direct GPIO logic connection";

      if (comp.interface.includes("I2C")) {
        pin = "SDA / SCL";
        mcuPort = activeMCU.name.includes("ESP32") ? "GPIO 21 / 22" : activeMCU.name.includes("Arduino") ? "A4 / A5" : "I2C-1 (Pins 3 / 5)";
        note = "Add 4.7k Ohm pull-up resistors if line unstable";
      } else if (comp.interface.includes("UART")) {
        pin = "TX / RX";
        mcuPort = activeMCU.name.includes("ESP32") ? "GPIO 16 / 17" : activeMCU.name.includes("Arduino") ? "D0 / D1 (Hardware Serial)" : "UART-0 (Pins 8 / 10)";
        note = "Cross TX->RX and RX->TX";
      } else if (comp.interface.includes("PWM")) {
        pin = "PWM Input";
        mcuPort = activeMCU.name.includes("Arduino") ? `PWM D${(idx % 6) + 3}` : `GPIO ${idx + 12} (PWM)`;
        note = "Isolate motor power; common GND required";
      } else if (comp.id.includes("hcsr04") || comp.name.toLowerCase().includes("ultrasonic")) {
        pin = "Trig / Echo";
        mcuPort = "D12 (Trig) / D13 (Echo)";
        note = "Use voltage divider on 5V Echo for 3.3V MCU";
      } else if (comp.category === "Power Supply" || comp.name.toLowerCase().includes("battery")) {
        pin = "VCC (+) / GND (-)";
        mcuPort = "VIN / GND Rail";
        note = "Route through step-down regulator / UBEC";
      }

      const fullProto = comp.interface.trim() || protocol || "General Purpose I/O (GPIO)";
      const fullNotes = `${note}. ${comp.specs ? `Hardware: ${comp.specs}` : ""}`;
      const costOnlyStr = `$${comp.estimatedPriceUSD}.00 USD`;

      const protoLines = doc.splitTextToSize(fullProto, 46);
      const noteLines = doc.splitTextToSize(fullNotes, 88);
      const maxLines = Math.max(protoLines.length, noteLines.length, 1);

      const primaryHeight = 6.5;
      const extensionHeight = 4.5 + maxLines * 3.6;
      const totalItemHeight = primaryHeight + extensionHeight;

      if (y + totalItemHeight > 260) {
        doc.addPage();
        renderHeader("Master Circuit Wiring & Pinout Schema (Cont.)", "Hardware connection matrix and pinout mapping (Continued)", ACCENT_PURPLE);
        y = 35;
        y = renderWiringTableHeader(y);
      }

      if (idx % 2 === 1) {
        doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
        doc.rect(margin, y, pageWidth - 2 * margin, totalItemHeight, "F");
      }

      doc.setFillColor(ACCENT_PURPLE[0], ACCENT_PURPLE[1], ACCENT_PURPLE[2]);
      doc.rect(margin, y, 1.2, totalItemHeight, "F");

      // 1. PRIMARY ROW
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(comp.name, margin + 4, y + 4.8);

      // Match font style to the corresponding section (helvetica bold, TEXT_DARK) and ensure all text is included
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      const pinLines = doc.splitTextToSize(`${pin}  ->  ${mcuPort}`, pageWidth - margin - 85 - 4);
      doc.text(pinLines, margin + 85, y + 4.8);

      doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
      doc.setLineWidth(0.15);
      doc.line(margin + 3, y + primaryHeight, pageWidth - margin - 3, y + primaryHeight);

      // 2. EXTENSION ROW
      const extY = y + primaryHeight;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.text("PROTOCOL:", margin + 4, extY + 3.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(protoLines, margin + 4, extY + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.text("WIRING SPECS & NOTES:", margin + 54, extY + 3.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(noteLines, margin + 54, extY + 7);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.text("EST. COST:", pageWidth - margin - 4, extY + 3.5, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(costOnlyStr, pageWidth - margin - 4, extY + 8, { align: "right" });

      doc.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
      doc.setLineWidth(0.25);
      doc.line(margin, y + totalItemHeight, pageWidth - margin, y + totalItemHeight);

      y += totalItemHeight;
    });

    if (y + 35 > 270) {
      doc.addPage();
      renderHeader("Master Circuit Wiring & Pinout Schema (Cont.)", "Hardware connection matrix and pinout mapping (Continued)", ACCENT_PURPLE);
      y = 35;
    }

    y += 6;
    doc.setFillColor(254, 242, 242);
    doc.rect(margin, y, pageWidth - 2 * margin, 20, "F");
    doc.setDrawColor(254, 202, 202);
    doc.rect(margin, y, pageWidth - 2 * margin, 20, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text("CRITICAL ELECTRICAL PROTECTION RULES:", margin + 4, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(127, 29, 29);
    doc.text("1. Inductive Spike Isolation: High-torque servos or motors MUST be powered from an external battery/UBEC rail, NOT the MCU 5V pin.", margin + 4, y + 10);
    doc.text("2. Logic Shifting: Interfacing a 5V sensor output to a 3.3V GPIO (e.g. Raspberry Pi / ESP32) requires a logic level shifter or divider.", margin + 4, y + 15);

    return y + 26;
  };

  // Render according to selected mode
  if (exportMode === "budget") {
    renderHeader("Project Budget & BOM Report", "Financial breakdown and supplier estimation analysis", ACCENT_CYAN);
    renderBudgetView(35);
  } else if (exportMode === "wiring") {
    renderHeader("Wiring Schema & Pinout Report", "Hardware connection matrix and logic interface protocols", ACCENT_PURPLE);
    renderWiringView(35);
  } else if (exportMode === "full") {
    renderHeader("Master Project Budget & BOM Report", "Page 1 of 2 — Financial breakdown and inventory analysis", ACCENT_CYAN);
    renderBudgetView(35);

    doc.addPage();
    renderHeader("Master Circuit Wiring & Pinout Schema", "Page 2 of 2 — Pin mapping matrix and electrical guidelines", ACCENT_PURPLE);
    renderWiringView(35);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text("AI RoboPet Suite — Designed with Google AI Studio", pageWidth / 2, 288, { align: "center" });

  const viewTitle = exportMode === "budget" ? "Budget" : exportMode === "wiring" ? "Wiring_Schema" : "Full_Report";
  const filename = `AIRoboPet_${viewTitle}_${formattedRobotType.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
  return filename;
}
