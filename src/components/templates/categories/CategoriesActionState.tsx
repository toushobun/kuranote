"use client";

import { useActionState, useState, type ComponentProps } from "react";

import {
  ActionFailureFeedback,
  SuccessFeedbackDialog,
} from "molecules/ui/OperationFeedbackDialogs";
import { bottomNavigationLayout } from "organisms/navigation/bottomNavigationLayout";
import type {
  CategoryActionState,
  CategoryStateAction,
} from "types/categories";

import { CategoriesTemplate } from "./Categories";

const initialCategoryActionState: CategoryActionState = {};
const feedbackBottomOffset = `calc(${bottomNavigationLayout.shellPaddingBottom} + 8px)`;

function CategorySuccessFeedback({ state }: { state: CategoryActionState }) {
  const [closedState, setClosedState] = useState<CategoryActionState | null>(
    null,
  );

  return (
    <SuccessFeedbackDialog
      aboveModal
      bottomOffset={feedbackBottomOffset}
      onClose={() => setClosedState(state)}
      open={!!state.success && state !== closedState}
      title={state.success}
    />
  );
}

type CategoriesActionStateTemplateProps = Omit<
  ComponentProps<typeof CategoriesTemplate>,
  | "archiveCategoryAction"
  | "archiveState"
  | "createCategoryAction"
  | "createState"
  | "onReorderError"
  | "updateCategoryAction"
  | "updateState"
> & {
  archiveCategoryAction: CategoryStateAction;
  createCategoryAction: CategoryStateAction;
  updateCategoryAction: CategoryStateAction;
};

export function CategoriesActionStateTemplate({
  archiveCategoryAction,
  createCategoryAction,
  updateCategoryAction,
  ...templateProps
}: CategoriesActionStateTemplateProps) {
  const [createState, createAction] = useActionState(
    createCategoryAction,
    initialCategoryActionState,
  );
  const [updateState, updateAction] = useActionState(
    updateCategoryAction,
    initialCategoryActionState,
  );
  const [archiveState, archiveAction] = useActionState(
    archiveCategoryAction,
    initialCategoryActionState,
  );
  const [reorderState, setReorderState] = useState<CategoryActionState>(
    initialCategoryActionState,
  );

  return (
    <>
      <CategoriesTemplate
        {...templateProps}
        archiveCategoryAction={archiveAction}
        archiveState={archiveState}
        createCategoryAction={createAction}
        createState={createState}
        onReorderError={setReorderState}
        updateCategoryAction={updateAction}
        updateState={updateState}
      />
      <CategorySuccessFeedback state={createState} />
      <CategorySuccessFeedback state={updateState} />
      <CategorySuccessFeedback state={archiveState} />
      <ActionFailureFeedback
        aboveModal
        state={createState}
        title="分类新增失败"
      />
      <ActionFailureFeedback
        aboveModal
        state={updateState}
        title="分类更新失败"
      />
      <ActionFailureFeedback
        aboveModal
        state={archiveState}
        title="分类归档失败"
      />
      <ActionFailureFeedback
        aboveModal
        state={reorderState}
        title="分类排序保存失败"
      />
    </>
  );
}
