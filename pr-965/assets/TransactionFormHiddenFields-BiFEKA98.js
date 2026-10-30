import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{d as i,f as a,w as o}from"./transaction-uDwIDRHz.js";function s(e){return`${c}${e}`}var c,l=t((()=>{a(),o(),i(),c=`itemExpectedUpdatedAt__`}));function u(e){return{account:e>1?`paymentAccountId`:`accountId`,amount:e>1?`paymentAmount`:void 0}}function d({item:e}){return(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(`input`,{name:`itemCategoryId`,type:`hidden`,value:e.categoryId}),(0,p.jsx)(`input`,{name:`itemPersistedId`,type:`hidden`,value:e.persistedId??``}),e.persistedId&&e.expectedUpdatedAt?(0,p.jsx)(`input`,{name:s(e.persistedId),type:`hidden`,value:e.expectedUpdatedAt}):null,(0,p.jsx)(`input`,{name:`itemSpecialStatus`,type:`hidden`,value:e.specialStatus??``}),(0,p.jsx)(`input`,{name:`itemRefundedItemId`,type:`hidden`,value:e.refundCandidate?.id??``}),(0,p.jsx)(`input`,{name:`itemReimbursementItemId`,type:`hidden`,value:e.reimbursementCandidate?.id??``})]})}function f({form:e,initialValues:t,includeVisibleFields:n=!1}){let r=u(e.payments.length);return(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(`input`,{name:`timeZoneOffsetMinutes`,type:`hidden`,value:e.timeZoneOffsetMinutes}),(0,p.jsx)(`input`,{name:`transactionAt`,type:`hidden`,value:e.transactionAtValue}),(0,p.jsx)(`input`,{name:`type`,type:`hidden`,value:e.selectedType}),t?.transactionRecordId&&(0,p.jsx)(`input`,{name:`transactionRecordId`,type:`hidden`,value:t.transactionRecordId}),t?.expectedRecordUpdatedAt&&(0,p.jsx)(`input`,{name:`expectedRecordUpdatedAt`,type:`hidden`,value:t.expectedRecordUpdatedAt}),n&&(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(`input`,{name:`merchantId`,type:`hidden`,value:e.selectedMerchantId}),(0,p.jsx)(`input`,{name:`note`,type:`hidden`,value:e.note}),e.payments.map(e=>(0,p.jsxs)(m.Fragment,{children:[(0,p.jsx)(`input`,{name:r.account,type:`hidden`,value:e.accountId}),r.amount&&(0,p.jsx)(`input`,{name:r.amount,type:`hidden`,value:e.amount})]},e.key)),e.itemSummaries.map(e=>(0,p.jsxs)(m.Fragment,{children:[(0,p.jsx)(d,{item:e}),(0,p.jsx)(`input`,{name:`itemAmount`,type:`hidden`,value:e.amount})]},e.id))]})]})}var p,m,h=t((()=>{p=r(),m=e(n()),l(),d.__docgenInfo={description:``,methods:[],displayName:`TransactionItemHiddenFields`,props:{item:{required:!0,tsType:{name:`signature`,type:`object`,raw:`{
  amount: string;
  businessNetAmount?: string;
  businessStatus?: TransactionBusinessStatus | null;
  categoryId: string;
  expectedUpdatedAt?: string;
  id: number;
  persistedId?: string;
  reimbursementCandidate?: TransactionRefundCandidate | null;
  refundedAmount?: string;
  reimbursementAmount?: string;
  refundCandidate?: TransactionRefundCandidate | null;
  specialStatus?: TransactionSpecialStatus | null;
  specialStatusLocked?: boolean;
}`,signature:{properties:[{key:`amount`,value:{name:`string`,required:!0}},{key:`businessNetAmount`,value:{name:`string`,required:!1}},{key:`businessStatus`,value:{name:`union`,raw:`TransactionBusinessStatus | null`,elements:[{name:`TransactionBusinessStatus`},{name:`null`}],required:!1}},{key:`categoryId`,value:{name:`string`,required:!0}},{key:`expectedUpdatedAt`,value:{name:`string`,required:!1}},{key:`id`,value:{name:`number`,required:!0}},{key:`persistedId`,value:{name:`string`,required:!1}},{key:`reimbursementCandidate`,value:{name:`union`,raw:`TransactionRefundCandidate | null`,elements:[{name:`TransactionRefundCandidate`},{name:`null`}],required:!1}},{key:`refundedAmount`,value:{name:`string`,required:!1}},{key:`reimbursementAmount`,value:{name:`string`,required:!1}},{key:`refundCandidate`,value:{name:`union`,raw:`TransactionRefundCandidate | null`,elements:[{name:`TransactionRefundCandidate`},{name:`null`}],required:!1}},{key:`specialStatus`,value:{name:`union`,raw:`TransactionSpecialStatus | null`,elements:[{name:`TransactionSpecialStatus`},{name:`null`}],required:!1}},{key:`specialStatusLocked`,value:{name:`boolean`,required:!1}}]}},description:``}}},f.__docgenInfo={description:``,methods:[],displayName:`TransactionFormHiddenFields`,props:{form:{required:!0,tsType:{name:`ReturnType`,elements:[{name:`useTransactionForm`}],raw:`ReturnType<typeof useTransactionForm>`},description:``},initialValues:{required:!1,tsType:{name:`signature`,type:`object`,raw:`{
  // 编辑时的记录级乐观锁版本，原样作为隐藏字段提交。
  expectedRecordUpdatedAt?: string;
  items: TransactionFormInitialItem[];
  merchantId: string;
  note: string;
  // 按录入顺序；1 行为单账户（金额由明细推导），≥ 2 行为多账户。
  payments: TransactionPayment[];
  transactionAt: string;
  transactionRecordId?: string;
  type: TransactionType;
}`,signature:{properties:[{key:`expectedRecordUpdatedAt`,value:{name:`string`,required:!1}},{key:`items`,value:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{
  amount: string;
  businessNetAmount?: string;
  businessStatus?: TransactionBusinessStatus | null;
  categoryId: string;
  expectedUpdatedAt?: string;
  id?: string;
  refundCandidate?: TransactionRefundCandidate | null;
  reimbursementCandidate?: TransactionRefundCandidate | null;
  refundedAmount?: string;
  // 被其他记录报销核销的金额（编辑时由服务端读取）。
  reimbursementAmount?: string;
  specialStatus?: TransactionSpecialStatus | null;
}`,signature:{properties:[{key:`amount`,value:{name:`string`,required:!0}},{key:`businessNetAmount`,value:{name:`string`,required:!1}},{key:`businessStatus`,value:{name:`union`,raw:`TransactionBusinessStatus | null`,elements:[{name:`TransactionBusinessStatus`},{name:`null`}],required:!1}},{key:`categoryId`,value:{name:`string`,required:!0}},{key:`expectedUpdatedAt`,value:{name:`string`,required:!1}},{key:`id`,value:{name:`string`,required:!1}},{key:`refundCandidate`,value:{name:`union`,raw:`TransactionRefundCandidate | null`,elements:[{name:`TransactionRefundCandidate`},{name:`null`}],required:!1}},{key:`reimbursementCandidate`,value:{name:`union`,raw:`TransactionRefundCandidate | null`,elements:[{name:`TransactionRefundCandidate`},{name:`null`}],required:!1}},{key:`refundedAmount`,value:{name:`string`,required:!1}},{key:`reimbursementAmount`,value:{name:`string`,required:!1}},{key:`specialStatus`,value:{name:`union`,raw:`TransactionSpecialStatus | null`,elements:[{name:`TransactionSpecialStatus`},{name:`null`}],required:!1}}]}}],raw:`TransactionFormInitialItem[]`,required:!0}},{key:`merchantId`,value:{name:`string`,required:!0}},{key:`note`,value:{name:`string`,required:!0}},{key:`payments`,value:{name:`Array`,elements:[{name:`TransactionPayment`}],raw:`TransactionPayment[]`,required:!0}},{key:`transactionAt`,value:{name:`string`,required:!0}},{key:`transactionRecordId`,value:{name:`string`,required:!1}},{key:`type`,value:{name:`TransactionType`,required:!0}}]}},description:``},includeVisibleFields:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}}}}}));export{h as i,d as n,u as r,f as t};