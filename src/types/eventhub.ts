export interface AuthInput {
  email:    string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id:    number;
    email: string;
  };
}

export interface MeResponse {
  id:    number;
  email: string;
}

export interface Event {
  id:             number;
  title:          string;
  category:       string;
  venue:          string;
  city:           string;
  eventDate:      string;
  price:          number;
  totalSeats:     number;
  availableSeats: number;
  description?:   string;
  imageUrl?:      string;
}

export interface CreateEventInput {
  title:        string;
  category:     string;
  venue:        string;
  city:         string;
  eventDate:    string;
  price:        number;
  totalSeats:   number;
  description?: string;
  imageUrl?:    string;
}

export interface Booking {
  id:            number;
  bookingRef:    string;
  eventId:       number;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
  quantity:      number;
  status:        'confirmed' | 'cancelled';
  event?:        Event;
}

export interface CreateBookingInput {
  eventId:       number;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
  quantity:      number;
}

export interface PaginationMeta {
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
}

export interface PaginatedResponse<T> {
  data:       T[];
  pagination: PaginationMeta;
}

export interface HealthResponse {
  status:    string;
  timestamp: string;
  dbStatus:  string;
}
