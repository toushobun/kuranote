export const transactionSetupHintMessages = {
  addAccount: "添加账户",
  transferMissingTwoAccounts: {
    title: "还差两个账户",
    description: "转账需要至少两个账户",
  },
  transferMissingOneAccount: {
    title: "还差一个账户",
    description: "转账需要至少两个账户",
  },
} as const;

export const transactionBottomEditorDrawerMessages = {
  done: "完成",
  close: (title: string) => `关闭${title}编辑`,
} as const;
