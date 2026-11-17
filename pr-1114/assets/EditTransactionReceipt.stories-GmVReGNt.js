import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{o as n,r}from"./paths-Cn5DhC5u.js";import{F as i,I as a}from"./iframe-B_mGHbmj.js";import{n as o,t as s}from"./Stack-CedAN9w3.js";import{n as c,t as l}from"./link-Du4AGLbo.js";import{i as u,n as d,t as ee}from"./transactionStepFlowMessages-DFuic6_I.js";import{n as te,r as f,t as p}from"./BackLayerScope-CrPHAvL2.js";import{M as m,t as h}from"./transaction-KQYSEJfm.js";import{n as ne,t as re}from"./ReceiptLongRounded-szUHgSDj.js";import{a as ie,i as ae,o as oe,s as g}from"./AccountStep-DKlbrwds.js";import{a as se,i as ce,n as le}from"./transactionStepFlowStoryUtils-Ujha1LzW.js";import{n as _,r as ue}from"./transactionStepFlow-BdbS7D1i.js";import{m as de,p as fe}from"./ReceiptTimeButton-B12FzWwH.js";import{f as pe,p as me}from"./TransactionLinkCandidatePanel-IpkqP8GM.js";import{c as he,i as ge,n as _e,r as ve,s as ye,t as be}from"./useReceiptMerchantPicker-eV2ycYGO.js";import{n as xe,t as Se}from"./ReceiptMerchantDrawer-sisPBWJ8.js";import{n as v,t as y}from"./useMerchantEntrySuggestions-CDHJASnd.js";import{i as b,o as x,t as S}from"./transactionReceipt-5gYkE4Vy.js";import{a as C,i as w,n as T,o as E,r as D,t as O}from"./NewTransactionVisualFrame-BR6_KpEM.js";function k({initialValues:e,canWriteTransactions:t,transactionItemSpecialStatusEnabled:r}){if(!t||!r||e.type!==`expense`||!e.transactionRecordId)return null;let i=e.items.some(e=>e.specialStatus===`pendingReimbursement`),s=t=>`${n.transactions}/new?${t}From=${encodeURIComponent(e.transactionRecordId)}`;return(0,A.jsxs)(o,{direction:`row`,sx:{...de,justifyContent:`space-around`},children:[(0,A.jsx)(a,{component:c,href:s(`refund`),startIcon:(0,A.jsx)(pe,{}),fullWidth:!0,children:u.refund}),i&&(0,A.jsx)(a,{component:c,href:s(`reimbursement`),startIcon:(0,A.jsx)(re,{}),fullWidth:!0,children:u.reimbursement})]})}var A,j=e((()=>{A=t(),l(),i(),s(),me(),ne(),r(),d(),fe(),k.__docgenInfo={description:``,methods:[],displayName:`TransactionOffsetActions`,props:{initialValues:{required:!0,tsType:{name:`intersection`,raw:`Omit<TransactionFormInitialValues, "type"> & {
  type:
    | TransactionFormInitialValues["type"]
    | "transfer"
    | "balance_adjustment";
}`,elements:[{name:`Omit`,elements:[{name:`signature`,type:`object`,raw:`{
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
}`,signature:{properties:[{key:`amount`,value:{name:`string`,required:!0}},{key:`businessNetAmount`,value:{name:`string`,required:!1}},{key:`businessStatus`,value:{name:`union`,raw:`TransactionBusinessStatus | null`,elements:[{name:`TransactionBusinessStatus`},{name:`null`}],required:!1}},{key:`categoryId`,value:{name:`string`,required:!0}},{key:`expectedUpdatedAt`,value:{name:`string`,required:!1}},{key:`id`,value:{name:`string`,required:!1}},{key:`refundCandidate`,value:{name:`union`,raw:`TransactionRefundCandidate | null`,elements:[{name:`TransactionRefundCandidate`},{name:`null`}],required:!1}},{key:`reimbursementCandidate`,value:{name:`union`,raw:`TransactionRefundCandidate | null`,elements:[{name:`TransactionRefundCandidate`},{name:`null`}],required:!1}},{key:`refundedAmount`,value:{name:`string`,required:!1}},{key:`reimbursementAmount`,value:{name:`string`,required:!1}},{key:`specialStatus`,value:{name:`union`,raw:`TransactionSpecialStatus | null`,elements:[{name:`TransactionSpecialStatus`},{name:`null`}],required:!1}}]}}],raw:`TransactionFormInitialItem[]`,required:!0}},{key:`merchantId`,value:{name:`string`,required:!0}},{key:`note`,value:{name:`string`,required:!0}},{key:`payments`,value:{name:`Array`,elements:[{name:`TransactionPayment`}],raw:`TransactionPayment[]`,required:!0}},{key:`transactionAt`,value:{name:`string`,required:!0}},{key:`transactionRecordId`,value:{name:`string`,required:!1}},{key:`type`,value:{name:`TransactionType`,required:!0}}]}},{name:`literal`,value:`"type"`}],raw:`Omit<TransactionFormInitialValues, "type">`},{name:`signature`,type:`object`,raw:`{
  type:
    | TransactionFormInitialValues["type"]
    | "transfer"
    | "balance_adjustment";
}`,signature:{properties:[{key:`type`,value:{name:`union`,raw:`| TransactionFormInitialValues["type"]
| "transfer"
| "balance_adjustment"`,elements:[{name:`TransactionType`,raw:`TransactionFormInitialValues["type"]`},{name:`literal`,value:`"transfer"`},{name:`literal`,value:`"balance_adjustment"`}],required:!0}}]}}]},description:``},canWriteTransactions:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}}));function Ce({accountOptions:e,initialValues:t,itemsOptions:n,ledgerId:r,merchantOptions:i,readOnly:a}){let o=ge({accounts:e,merchants:i,itemsOptions:n,initialValues:t}),{suggestions:s,suggestionsMerchantId:c,selectSuggestionMerchant:l}=v({initialMerchantId:a?void 0:t.merchantId||void 0,ledgerId:r}),u=_e(d);function d(e){o.form.handleMerchantChange(e.id),l(e)}return{...o,suggestions:c===o.form.selectedMerchantId?s:void 0,merchantPicker:u}}var we=e((()=>{be(),ve(),y()}));function M(e){let t=e.initialValues.transactionRecordId;if(!t)throw Error(`transactionRecordId is required for edit transaction.`);return(0,N.jsx)(p,{level:f.receiptEditor,children:(0,N.jsx)(C,{action:e.action,canDelete:e.canDelete,deleteAction:e.deleteAction,editRestriction:e.editRestriction,hasLinkedIncomeItems:e.initialValues.items.some(e=>e.businessStatus?.incomeLinkRole!=null),initialLinkedTargets:e.initialValues.items.flatMap(e=>{if(!e.id||!e.businessStatus?.incomeLinkRole)return[];let t=e.businessStatus.incomeLinkRole===`refund`?e.refundCandidate:e.reimbursementCandidate;return t?[{incomeItemId:e.id,kind:e.businessStatus.incomeLinkRole,label:t.categoryName,currency:t.accountCurrency,surplus:e.businessNetAmount??e.amount,targetItemId:t.id}]:[]}),saveFormId:P,transactionRecordId:t,children:t=>(0,N.jsx)(Te,{...e,formAction:t.formAction,saving:t.isPending,onValidationFailed:t.onValidationFailed})})})}function Te({formAction:e,saving:t,onValidationFailed:n,...r}){let i=ie(),a={...r,merchantOptions:g(r.merchantOptions,i?.merchants),accountOptions:g(r.accountOptions,i?.accounts)},o=a.editRestriction!==null,s=w(a.accountOptions,a.archivedAccountOptions),c=Ce({accountOptions:s,initialValues:a.initialValues,itemsOptions:{categoryOptions:a.categoryOptions,multiAccountPaymentEnabled:a.multiAccountPaymentEnabled,transactionItemSpecialStatusEnabled:a.transactionItemSpecialStatusEnabled},ledgerId:a.ledgerId,merchantOptions:a.merchantOptions,readOnly:o});return(0,N.jsxs)(N.Fragment,{children:[(0,N.jsx)(`input`,{form:P,name:`sourceType`,readOnly:!0,type:`hidden`,value:a.initialValues.type}),(0,N.jsx)(ye,{...c.itemsOptions,form:c.form,formId:P,initialValues:a.initialValues,amountItemId:c.amountItemId,onAmountItemChange:c.setAmountItemId,accountOptions:s,suggestions:c.suggestions,action:e,onValidationFailed:n,saving:t,submitLabel:ee.saveEdit,onMerchantClick:c.merchantPicker.openPicker,readOnly:o,footer:(0,N.jsx)(k,{initialValues:a.initialValues,canWriteTransactions:a.canWriteTransactions,transactionItemSpecialStatusEnabled:a.transactionItemSpecialStatusEnabled})}),(0,N.jsx)(Se,{picker:c.merchantPicker,merchants:a.merchantOptions,merchantTags:a.merchantTags,frequentMerchants:a.frequentMerchants})]})}var N,P,Ee=e((()=>{N=t(),te(),ae(),oe(),d(),xe(),he(),j(),E(),D(),we(),P=`edit-transaction-receipt-form`,M.__docgenInfo={description:`编辑普通记录（#962）：显示预填的小票，删除按钮在保存下方。`,methods:[],displayName:`EditTransactionReceiptTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},archivedAccountOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:`已归档的付款账户（只读时用来显示账户名称与记录实际币种）。`},canDelete:{required:!0,tsType:{name:`boolean`},description:``},canWriteTransactions:{required:!0,tsType:{name:`boolean`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读小票（没有铅笔、×、保存）。`},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``},ledgerId:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},multiAccountPaymentEnabled:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}})),F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{F=t(),h(),le(),S(),ue(),Ee(),T(),{userEvent:I,within:L}=__STORYBOOK_MODULE_TEST__,R={items:[{amount:`800`,categoryId:`lunch`,specialStatus:null},{amount:`250`,categoryId:`coffee`,specialStatus:null}],merchantId:`seven`,note:`和同事一起`,payments:[{accountId:`paypay`,amount:null}],transactionAt:`2026-10-29T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},z={...R,items:[{amount:`1200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`lunch`,expectedUpdatedAt:`2026-10-29T03:21:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,reimbursementAmount:`1200`,specialStatus:`reimbursed`}]},B={title:`Templates/Transactions/EditTransactionReceipt`,component:M,decorators:[...se,ce,e=>(0,F.jsx)(O,{children:(0,F.jsx)(e,{})})],args:{accountOptions:_.accounts,action:async()=>({}),canDelete:!0,canWriteTransactions:!0,categoryOptions:b.categoryOptions,deleteAction:async()=>({}),editRestriction:null,frequentMerchants:_.frequentMerchants,initialValues:R,ledgerId:`ledger-1`,merchantOptions:_.merchants,merchantTags:_.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!0},parameters:{viewport:{defaultViewport:`mobile2`}}},V={name:`编辑记账（预填小票）`},H={name:`编辑小票：点击保存后提示未填金额`,args:{initialValues:{...R,items:[{amount:``,categoryId:`lunch`,specialStatus:null}]}},play:async({canvasElement:e})=>{await I.click(L(e).getByRole(`button`,{name:`保存修改`}))}},U={name:`多账户付款`,args:{initialValues:{...R,payments:[{accountId:`paypay`,amount:`700`},{accountId:`cash`,amount:`350`}]}}},W={name:`小票商家抽屉（支持新增商家）`,play:async({canvasElement:e})=>{await I.click(await L(e).findByRole(`button`,{name:`修改商家：7-Eleven`}))}},G={name:`只读详情：他人创建的记录`,args:{canDelete:!1,editRestriction:`permission`}},K={name:`只读详情：账户已归档（可删除）`,args:{accountOptions:_.accounts.filter(e=>e.id!==`paypay`),archivedAccountOptions:_.accounts.filter(e=>e.id===`paypay`),editRestriction:`archivedAccount`}},q={name:`删除仍被子项关联的母项被拒绝`,args:{deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:m.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:z},play:async({canvasElement:e})=>{let t=L(e);await I.click(await t.findByRole(`button`,{name:`删除`})),await I.click(await L(document.body).findByRole(`button`,{name:`删除`})),await L(document.body).findByText(`无法删除已关联明细`)}},J={name:`小票 · 退款 ¥1,980 / 抵消 ¥980 / 倒赚 ¥1,000`,args:{categoryOptions:x.categoryOptions,initialValues:{...R,type:`income`,items:x.items}}},Y={name:`编辑支出：退款入口`,args:{canWriteTransactions:!0}},X={name:`编辑支出：退款及报销入口`,args:{canWriteTransactions:!0,initialValues:{...R,items:[{...R.items[0],specialStatus:`pendingReimbursement`}]}}},Z={name:`只读支出：退款入口`,args:{canWriteTransactions:!0,editRestriction:`archivedAccount`}},Q={...X,name:`只读支出：退款及报销入口`,args:{...X.args,editRestriction:`permission`}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "编辑记账（预填小票）"
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "编辑小票：点击保存后提示未填金额",
  args: {
    initialValues: {
      ...initialValues,
      items: [{
        amount: "",
        categoryId: "lunch",
        specialStatus: null
      }]
    }
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "保存修改"
    }));
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "多账户付款",
  args: {
    initialValues: {
      ...initialValues,
      payments: [{
        accountId: "paypay",
        amount: "700"
      }, {
        accountId: "cash",
        amount: "350"
      }]
    }
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "小票商家抽屉（支持新增商家）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", {
      name: "修改商家：7-Eleven"
    }));
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "只读详情：他人创建的记录",
  args: {
    canDelete: false,
    editRestriction: "permission"
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "只读详情：账户已归档（可删除）",
  args: {
    accountOptions: flowFixture.accounts.filter(account => account.id !== "paypay"),
    archivedAccountOptions: flowFixture.accounts.filter(account => account.id === "paypay"),
    editRestriction: "archivedAccount"
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "删除仍被子项关联的母项被拒绝",
  args: {
    deleteAction: async () => ({
      error: "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
      errorCode: transactionErrorCodes.linkedDeleteForbidden,
      errorKey: "storybook-linked-delete-forbidden"
    }),
    initialValues: reimbursedInitialValues
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("无法删除已关联明细");
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "小票 · 退款 ¥1,980 / 抵消 ¥980 / 倒赚 ¥1,000",
  args: {
    categoryOptions: savedRefundReceipt.categoryOptions,
    initialValues: {
      ...initialValues,
      type: "income",
      items: savedRefundReceipt.items
    }
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "编辑支出：退款入口",
  args: {
    canWriteTransactions: true
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "编辑支出：退款及报销入口",
  args: {
    canWriteTransactions: true,
    initialValues: {
      ...initialValues,
      items: [{
        ...initialValues.items[0],
        specialStatus: "pendingReimbursement"
      }]
    }
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "只读支出：退款入口",
  args: {
    canWriteTransactions: true,
    editRestriction: "archivedAccount"
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  ...OffsetActionsPending,
  name: "只读支出：退款及报销入口",
  args: {
    ...OffsetActionsPending.args,
    editRestriction: "permission"
  }
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`InvalidAfterSave`,`MultiAccount`,`ChangeMerchant`,`ReadOnlyPermission`,`ReadOnlyArchivedAccount`,`LinkedDeleteForbidden`,`RefundSurplusReceipt1078`,`OffsetActions`,`OffsetActionsPending`,`ReadOnlyOffsetActions`,`ReadOnlyOffsetActionsPending`]}))();export{W as ChangeMerchant,V as Default,H as InvalidAfterSave,q as LinkedDeleteForbidden,U as MultiAccount,Y as OffsetActions,X as OffsetActionsPending,K as ReadOnlyArchivedAccount,Z as ReadOnlyOffsetActions,Q as ReadOnlyOffsetActionsPending,G as ReadOnlyPermission,J as RefundSurplusReceipt1078,$ as __namedExportsOrder,B as default};