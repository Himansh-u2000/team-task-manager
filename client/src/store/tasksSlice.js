import { createSlice } from '@reduxjs/toolkit';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    loading: false,
  },
  reducers: {
    setTasks(state, action) {
      state.items = action.payload;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    updateTaskStatus(state, action) {
      const { taskId, status } = action.payload;
      const task = state.items.find((t) => t._id === taskId);
      if (task) task.status = status;
    },
    moveTask(state, action) {
      const { taskId, newStatus, oldIndex, newIndex } = action.payload;
      const task = state.items.find((t) => t._id === taskId);
      if (!task) return;

      const oldTasks = state.items.filter((t) => t.status === task.status);
      const otherTasks = state.items.filter((t) => t.status !== task.status);

      oldTasks.splice(oldIndex, 1);
      task.status = newStatus;

      const targetTasks = state.items.filter((t) => t.status === newStatus && t._id !== taskId);
      targetTasks.splice(newIndex, 0, task);

      state.items = [...otherTasks.filter((t) => t.status !== newStatus), ...targetTasks];
    },
    removeTask(state, action) {
      state.items = state.items.filter((t) => t._id !== action.payload);
    },
  },
});

export const { setTasks, setLoading, updateTaskStatus, moveTask, removeTask } = tasksSlice.actions;
export default tasksSlice.reducer;
