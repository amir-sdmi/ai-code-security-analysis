//Test file generated with chatGPT  --- This is just to try how the testing works

import { configureStore } from "@reduxjs/toolkit";
import {
  createTask,
  getTasks,
  fetchOneTask,
  deleteTask,
  updateTask,
  taskSlice,
} from "./taskSlice";

describe("taskSlice", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: taskSlice.reducer,
    });
  });

  test("createTask", async () => {
    await store.dispatch(
      createTask({
        /* taskData here */
      })
    );

    const state = store.getState().task;
    expect(state.isLoading).toBe(false);
    expect(state.isSuccess).toBe(true);
    expect(state.isError).toBe(false);
    // Add more assertions based on your expectations
  });

  test("getTasks", async () => {
    await store.dispatch(getTasks());

    const state = store.getState().task;
    expect(state.isLoading).toBe(false);
    expect(state.isSuccess).toBe(true);
    expect(state.isError).toBe(false);
    // Add more assertions based on your expectations
  });

  // Similar tests for other async actions (fetchOneTask, deleteTask, updateTask)

  test("reset", () => {
    store.dispatch(taskSlice.actions.reset());

    const state = store.getState().task;
    expect(state).toEqual({
      tasks: [],
      isError: false,
      isSuccess: false,
      isLoading: false,
      message: "",
    });
  });
});
