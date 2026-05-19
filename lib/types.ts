export type TicketStatus = "available" | "sold" | "won";
export type BundleStatus = "available" | "sold";
export type PurchaseStatus = "pending" | "completed" | "failed";
export type PrizeStatus = "pending" | "drawn";
export type SpecialEventType = "discount" | "announcement";

export interface Ticket {
  id: string;
  player_name: string;
  display_name: string;
  is_bundle_member: boolean;
  bundle_id: string | null;
  bundle_index: number | null;
  status: TicketStatus;
  buyer_id: string | null;
  display_order: number;
  discount_price: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Bundle {
  id: string;
  player_name: string;
  special_label: string;
  special_price: number;
  status: BundleStatus;
  buyer_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_club: string;
  buyer_phone: string;
  ticket_ids: string[];
  total_amount: number;
  sumup_checkout_id: string | null;
  sumup_checkout_url: string | null;
  status: PurchaseStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Prize {
  id: string;
  name: string;
  description: string | null;
  estimated_value: number | null;
  image_url: string | null;
  display_order: number;
  status: PrizeStatus;
  winner_ticket_id: string | null;
  winner_purchase_id: string | null;
  drawn_at: string | null;
  created_at: string;
}

export interface SpecialEvent {
  id: string;
  label: string;
  ticket_id: string | null;
  type: SpecialEventType;
  is_active: boolean;
  created_at: string;
}

export interface BuyerInfo {
  firstName: string;
  lastName: string;
  club: string;
  phone: string;
}

export interface TicketWithBuyer extends Ticket {
  buyer?: Pick<Purchase, "buyer_first_name" | "buyer_last_name" | "buyer_club"> | null;
}
