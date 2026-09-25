/** 需要用户在映射步骤里处理的持有人姓名：账本里找不到成员，或有多个同名成员。 */
export type ImportHolderMappingCandidate = {
  name: string;
  /** 文件里持有人列出现该姓名的执行单元数（转账两侧都是该姓名时算 1 条）。 */
  recordCount: number;
  reason: "ambiguous" | "unmatched";
};
