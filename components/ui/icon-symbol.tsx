// Material Icons for all platforms — maps semantic names to MaterialIcons glyphs.
// Uses @expo/vector-icons/MaterialIcons as the icon provider.
// For a full reference: https://icons.expo.fyi/MaterialIcons
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";
import { BRAND, SRS, GRAY } from '@/lib/constants/figma-tokens';

export type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation & common UI
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "person.fill": "person",
  "person.add": "person-add",
  "person.search": "person-search",
  "settings": "settings",
  "search": "search",
  "close": "close",
  "menu": "menu",
  "more.horiz": "more-horiz",
  "more.vert": "more-vert",
  "arrow.back": "arrow-back",
  "arrow.forward": "arrow-forward",
  "arrow.upward": "arrow-upward",
  "arrow.downward": "arrow-downward",
  "refresh": "refresh",
  "edit": "edit",
  "delete": "delete",
  "add": "add",
  "remove": "remove",
  "check": "check",
  "checkmark": "check",
  "clear": "clear",
  "info": "info",
  "warning": "warning",
  "error": "error",
  "help": "help",
  "download": "download",
  "upload": "upload",
  "print": "print",
  "share": "share",
  "filter": "filter-list",
  "sort": "sort",
  "view.list": "view-list",
  "view.grid": "view-module",
  "fullscreen": "fullscreen",
  "fullscreen.exit": "fullscreen-exit",

  // Portal / Property
  "hotel": "hotel",
  "apartment": "apartment",
  "villa": "villa",
  "cottage": "cottage",
  "resort": "pool",
  "restaurant": "restaurant",
  "store": "store",
  "business": "business",
  "home": "home",
  "location": "location-on",
  "phone": "phone",
  "email": "email",
  "language": "language",
  "world": "public",
  "star": "star",
  "star.border": "star-border",
  "star.half": "star-half",

  // Front Desk & Bookings
  "front.desk": "countertops",
  "checkin": "login",
  "checkout": "logout",
  "booking": "calendar-today",
  "bookings": "calendar-today",
  "calendar": "calendar-month",
  "calendar.week": "calendar-view-week",
  "guests": "people",
  "guest": "person",
  "room": "meeting-room",
  "rooms": "meeting-room",
  "key": "vpn-key",
  "folio": "receipt",
  "invoice": "receipt-long",
  "payment": "payments",
  "receipt": "receipt",
  "qr.code": "qr-code",
  "barcode": "qr-code-scanner",

  // Room statuses
  "room.available": "check-circle",
  "room.occupied": "block",
  "room.dirty": "cleaning-services",
  "room.cleaning": "cleaning-services",
  "room.maintenance": "build",
  "maintenance": "build",
  "room.blocked": "lock",
  "room.inspected": "verified",

  // Housekeeping
  "housekeeping": "cleaning-services",
  "cleaning": "cleaning-services",
  "task": "assignment",
  "tasks": "assignment",
  "checklist": "checklist",
  "assignment": "assignment",
  "assignee": "assignment-ind",

  // POS & Restaurant
  "pos": "point-of-sale",
  "table": "table-restaurant",
  "tables": "table-restaurant",
  "restaurant.menu": "menu-book",
  "menu.food": "restaurant-menu",
  "food": "restaurant",
  "drink": "local-bar",
  "coffee": "coffee",
  "dessert": "cake",
  "order": "shopping-cart",
  "orders": "shopping-cart",
  "cart": "shopping-cart",
  "kitchen": "kitchen",
  "cook": "restaurant",
  "timer": "timer",
  "split.bill": "call-split",
  "discount": "local-offer",
  "loyalty": "card-membership",
  "wallet": "wallet",

  // KDS
  "kds": "tv",
  "pending": "hourglass-empty",
  "progress": "hourglass-top",
  "ready": "check-circle",
  "served": "done-all",
  "clock": "access-time",
  "alarm": "alarm",
  "bell": "notifications",
  "notifications": "notifications",

  // Analytics & Reports
  "analytics": "analytics",
  "chart": "bar-chart",
  "chart.line": "show-chart",
  "chart.pie": "pie-chart",
  "chart.bar": "bar-chart",
  "chart.donut": "donut-large",
  "trending.up": "trending-up",
  "trending.down": "trending-down",
  "revenue": "payments",
  "occupancy": "hotel",
  "report": "assessment",
  "confirmation-number": "confirmation-number",
  "content.copy": "content-copy",
  "export": "file-download",
  "csv": "table-chart",
  "pdf": "picture-as-pdf",
  "excel": "table-chart",

  // Staff & Users
  "group": "group",
  "staff": "badge",
  "manager": "supervisor-account",
  "waiter": "room-service",
  "chef": "restaurant",
  "shift": "schedule",
  "attendance": "fact-check",
  "clock.in": "login",
  "clock.out": "logout",

  // Communication
  "chat": "chat",
  "message": "message",
  "notification": "notifications",
  "announcement": "campaign",
  "feedback": "feedback",

  "logout": "logout",
  // Actions
  "minus": "remove",
  "save": "save",
  "cancel": "cancel",
  "confirm": "check-circle",
  "approve": "verified",
  "reject": "cancel",
  "approval": "verified",
  "lock": "lock",
  "unlock": "lock-open",
  "visibility": "visibility",
  "visibility.off": "visibility-off",
  "photo": "photo",
  "photo.library": "photo-library",
  "camera": "camera-alt",
  "upload.photo": "add-a-photo",
  "gallery": "photo-library",
  "file": "description",
  "file.upload": "file-upload",
  "folder": "folder",
  "link": "link",
  "external": "open-in-new",

  // Status
  "success": "check-circle",
  "warning.triangle": "warning",
  "error.x": "cancel",
  "info.circle": "info",
  "done": "done",
  "done.all": "done-all",
  "priority.high": "priority-high",
  "priority.low": "low-priority",

  "inventory": "inventory",
  // Misc
  "drag": "drag-indicator",
  "expand": "expand-more",
  "collapse": "expand-less",
  "lightbulb": "lightbulb",
  "tip": "lightbulb-outline",
  "question": "help-outline",
  "flag": "flag",
  "bookmark": "bookmark",
  "bookmark.border": "bookmark-border",
  "pin": "push-pin",
  "attach": "attachment",
  "tag": "label",
  "label": "label",
  "map": "map",
  "directions": "directions",
  "flight": "flight",
  "car": "directions-car",
  "airport": "flight",
  "transfer": "airport-shuttle",
  "spa": "spa",
  "parking": "local-parking",
  "wifi": "wifi",
  "verified": "verified",
  "pool": "pool",
  "gym": "fitness-center",
  "breakfast": "free-breakfast",
  "laundry": "local-laundry-service",
} as const satisfies Record<string, ComponentProps<typeof MaterialIcons>["name"]>;

type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
};

function resolveSize(size?: IconSize): number {
  if (size === undefined) return 22;
  if (typeof size === "number") return size;
  return SIZE_MAP[size] || 22;
}

/**
 * Semantic icon component using MaterialIcons from @expo/vector-icons.
 *
 * Usage:
 * ```tsx
 * <Icon name="hotel" size="md" color={BRAND.navyLight} />
 * <Icon name="room.available" size={32} color={SRS.green} />
 * ```
 */
export function IconSymbol({
  name,
  size,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: IconSize;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: any;
}) {
  const resolvedSize = resolveSize(size);
  const materialName = MAPPING[name];
  return <MaterialIcons color={color || GRAY[500]} size={resolvedSize} name={materialName} style={style} />;
}
