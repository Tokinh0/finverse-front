import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type UIState = { showTotals: boolean };

const initialState: UIState = { showTotals: false };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setShowTotals(state, action: PayloadAction<boolean>) {
      state.showTotals = action.payload;
    },
    toggleShowTotals(state) {
      state.showTotals = !state.showTotals;
    },
  },
});

export const { setShowTotals, toggleShowTotals } = uiSlice.actions;
export default uiSlice.reducer;
