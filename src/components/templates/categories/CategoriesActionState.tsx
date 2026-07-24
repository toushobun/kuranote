"use client";

import { useActionState, useState, type ComponentProps } from "react";

import { FailureFeedbackDialog } from "molecules/ui/OperationFeedbackDialogs";
import type {
  CategoryActionState,
  CategoryStateAction,
} from "types/categories";

import { CategoriesTemplate } from "./Categories";

const initialCategoryActionState: CategoryActionState = {};

type CategoriesActionStateTemplateProps = Omit<
  ComponentProps<typeof CategoriesTemplate>,
  | "archiveCategoryAction"
  | "createCategoryAction"
  | "onReorderError"
  | "updateCategoryAction"
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
        createCategoryAction={createAction}
        onReorderError={setReorderState}
        updateCategoryAction={updateAction}
      />
      <CategoryFailureFeedback state={createState} title="分类新增失败" />
      <CategoryFailureFeedback state={updateState} title="分类更新失败" />
      <CategoryFailureFeedback state={archiveState} title="分类隐藏失败" />
      <CategoryFailureFeedback state={reorderState} title="分类排序保存失败" />
    </>
  );
}

function CategoryFailureFeedback({
  state,
  title,
}: {
  state: CategoryActionState;
  title: string;
}) {
  const currentErrorKey = state.errorKey ?? state.error ?? null;
  const [closedErrorKey, setClosedErrorKey] = useState<string | null>(null);
  const open = state.error !== undefined && currentErrorKey !== closedErrorKey;

  return (
    <FailureFeedbackDialog
      aboveModal
      description={state.error ?? null}
      onClose={() => setClosedErrorKey(currentErrorKey)}
      open={open}
      title={title}
    />
  );
}
