import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

interface Event {
  id: number;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  category: string;
  maxAttendees: number;
  imageUrl: string;
  organizerId: number;
  organizer?: {
    id: number;
    name: string;
  };
}

interface EventsState {
  events: Event[];
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  loading: false,
  error: null,
};

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async () => {
    const response = await axios.get(`${API_BASE}/events`);
    return response.data;
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: Partial<Event>, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await axios.post(`${API_BASE}/events`, eventData, {
      headers: { Authorization: `Bearer ${state.auth.token}` }
    });
    return response.data;
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, ...eventData }: { id: number } & Partial<Event>, { getState }) => {
    const state = getState() as { auth: { token: string } };
    const response = await axios.put(`${API_BASE}/events/${id}`, eventData, {
      headers: { Authorization: `Bearer ${state.auth.token}` }
    });
    return response.data;
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (id: number, { getState }) => {
    const state = getState() as { auth: { token: string } };
    await axios.delete(`${API_BASE}/events/${id}`, {
      headers: { Authorization: `Bearer ${state.auth.token}` }
    });
    return id;
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch events';
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.events.push(action.payload.event);
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex(e => e.id === action.payload.event.id);
        if (index !== -1) {
          state.events[index] = action.payload.event;
        }
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter(e => e.id !== action.payload);
      });
  },
});

export const { clearError } = eventsSlice.actions;
export default eventsSlice.reducer;
