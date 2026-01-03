export enum ConnectionStatus {
  ONLINE = 'ONLINE',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
}

export enum ServerRegion {
  PRIMARY = 'AWS Singapore (Chính)',
  BACKUP = 'AWS Tokyo (Dự phòng)',
  EDGE = 'Edge CDN (Bộ nhớ đệm)',
}

export interface Property {
  id: string;
  title: string;
  price: string;
  priceRaw: number; // For calculator
  location: string;
  description: string;
  features: string[];
  imageUrl: string;
  videoUrl: string; // New video asset
  agentName: string;
  agentPhone: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  submittedAt: number;
  synced: boolean;
}

export enum TabView {
  OVERVIEW = 'Tổng quan',
  AMENITIES = 'Tiện ích',
  CALCULATOR = 'Tính vay', // New Tab
  LOCATION = 'Vị trí',
}