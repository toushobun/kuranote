export const transactionSetupHintMessages = {
  addAccount: "添加账户",
  addMerchant: "添加商家",
  emptyAccount: "暂无账户",
  emptyMerchant: "暂无商家",
  missingAccountAndMerchant: {
    title: "还差一点准备",
    description: "记账需要至少一个账户和一个商家，添加后就能保存啦",
  },
  missingMerchant: {
    title: "还差一个商家",
    description: "添加一个常去的商家，就能保存这笔记录了",
  },
  missingAccount: {
    title: "还差一个账户",
    description: "添加一个账户，就能保存这笔记录了",
  },
  transferMissingTwoAccounts: {
    title: "还差两个账户",
    description: "转账需要至少两个账户",
  },
  transferMissingOneAccount: {
    title: "还差一个账户",
    description: "转账需要至少两个账户",
  },
} as const;
