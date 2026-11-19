import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{o as i,r as a}from"./paths-Cn5DhC5u.js";import{F as o,I as s}from"./iframe-CQ1ecpQv.js";import{n as c,t as l}from"./Stack-CedAN9w3.js";import{n as u,t as d}from"./link-Du4AGLbo.js";import{i as f,n as p,t as ee}from"./transactionStepFlowMessages-PnKd8g44.js";import{n as te,r as ne,t as re}from"./BackLayerScope-CFEAeRAl.js";import{F as ie,t as ae}from"./transaction-ZAlq2OqH.js";import{a as oe,i as se}from"./transactionAttachmentClient-CwJkDoah.js";import{n as ce,t as le}from"./ReceiptLongRounded-szUHgSDj.js";import{a as ue,i as de,o as fe,s as m}from"./AccountStep-CQ4rdHNO.js";import{a as pe,i as me,n as he}from"./transactionStepFlowStoryUtils-B6O85GN7.js";import{n as h,r as ge}from"./transactionStepFlow-CBFmsXNX.js";import{o as _e,t as ve}from"./receiptStyles-DpQ_yuNz.js";import{f as ye,p as be}from"./TransactionLinkCandidatePanel-PyPbJa9g.js";import{n as g,r as xe}from"./EditTransactionDirtyContext-BrAvAbmr.js";import{a as Se,i as Ce,l as we,n as Te,o as Ee,r as De,t as _,u as v}from"./useReceiptMerchantPicker-CKjpKoCy.js";import{n as y,t as b}from"./ReceiptMerchantDrawer-CzVKumtN.js";import{n as x,t as S}from"./useMerchantEntrySuggestions-CLeD0bii.js";import{i as C,o as w,t as T}from"./transactionReceipt-6UQRY5A1.js";import{a as E,i as Oe,n as ke,o as Ae,r as je,t as Me}from"./NewTransactionVisualFrame-CbRjbvJS.js";function D({initialValues:e,canWriteTransactions:t,transactionItemSpecialStatusEnabled:n}){if(!t||!n||e.type!==`expense`||!e.transactionRecordId)return null;let r=e.items.some(e=>e.specialStatus===`pendingReimbursement`),a=t=>`${i.transactions}/new?${t}From=${encodeURIComponent(e.transactionRecordId)}`;return(0,O.jsxs)(c,{direction:`row`,sx:{..._e,justifyContent:`space-around`},children:[(0,O.jsx)(s,{component:u,href:a(`refund`),startIcon:(0,O.jsx)(ye,{}),fullWidth:!0,children:f.refund}),r&&(0,O.jsx)(s,{component:u,href:a(`reimbursement`),startIcon:(0,O.jsx)(le,{}),fullWidth:!0,children:f.reimbursement})]})}var O,Ne=t((()=>{O=r(),d(),o(),l(),be(),ce(),a(),p(),ve(),D.__docgenInfo={description:``,methods:[],displayName:`TransactionOffsetActions`,props:{initialValues:{required:!0,tsType:{name:`intersection`,raw:`Omit<TransactionFormInitialValues, "type"> & {
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
| "balance_adjustment"`,elements:[{name:`TransactionType`,raw:`TransactionFormInitialValues["type"]`},{name:`literal`,value:`"transfer"`},{name:`literal`,value:`"balance_adjustment"`}],required:!0}}]}}]},description:``},canWriteTransactions:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}}));function k({accountOptions:e,initialValues:t,itemsOptions:n,ledgerId:r,merchantOptions:i,readOnly:a}){let o=Ee({accounts:e,merchants:i,itemsOptions:n,initialValues:t}),{suggestions:s,suggestionsMerchantId:c,selectSuggestionMerchant:l}=x({initialMerchantId:a?void 0:t.merchantId||void 0,ledgerId:r}),u=Te(d);function d(e){o.form.handleMerchantChange(e.id),l(e)}return{...o,suggestions:c===o.form.selectedMerchantId?s:void 0,merchantPicker:u}}var Pe=t((()=>{_(),Se(),S()}));function A(e){let t=e.initialValues.transactionRecordId;if(!t)throw Error(`transactionRecordId is required for edit transaction.`);return(0,j.jsx)(re,{level:ne.receiptEditor,children:(0,j.jsx)(E,{action:e.action,canDelete:e.canDelete,deleteAction:e.deleteAction,editRestriction:e.editRestriction,hasLinkedIncomeItems:e.initialValues.items.some(e=>e.businessStatus?.incomeLinkRole!=null),initialLinkedTargets:e.initialValues.items.flatMap(e=>{if(!e.id||!e.businessStatus?.incomeLinkRole)return[];let t=e.businessStatus.incomeLinkRole===`refund`?e.refundCandidate:e.reimbursementCandidate;return t?[{incomeItemId:e.id,kind:e.businessStatus.incomeLinkRole,label:t.categoryName,currency:t.accountCurrency,surplus:e.businessNetAmount??e.amount,targetItemId:t.id}]:[]}),saveFormId:N,transactionRecordId:t,children:t=>(0,j.jsx)(Fe,{...e,formAction:t.formAction,saving:t.isPending,saveDisabled:t.saveDisabled,onValidationFailed:t.onValidationFailed})},t)})}function Fe({formAction:e,saving:t,saveDisabled:n,onValidationFailed:r,...i}){let a=ue(),o={...i,merchantOptions:m(i.merchantOptions,a?.merchants),accountOptions:m(i.accountOptions,a?.accounts)},s=o.editRestriction!==null,c=Ce({ledgerId:o.ledgerId,recordId:o.initialValues.transactionRecordId,readOnly:s}),l=xe();(0,M.useEffect)(()=>{l?.(c.touched,`photos`)},[l,c.touched]);async function u(t){await c.prepareForSave(t)&&(0,M.startTransition)(()=>e(t))}let d=Oe(o.accountOptions,o.archivedAccountOptions),f=k({accountOptions:d,initialValues:o.initialValues,itemsOptions:{categoryOptions:o.categoryOptions,multiAccountPaymentEnabled:o.multiAccountPaymentEnabled,transactionItemSpecialStatusEnabled:o.transactionItemSpecialStatusEnabled},ledgerId:o.ledgerId,merchantOptions:o.merchantOptions,readOnly:s});return(0,j.jsxs)(j.Fragment,{children:[(0,j.jsx)(`input`,{form:N,name:`sourceType`,readOnly:!0,type:`hidden`,value:o.initialValues.type}),(0,j.jsx)(we,{...f.itemsOptions,form:f.form,formId:N,initialValues:o.initialValues,amountItemId:f.amountItemId,onAmountItemChange:f.setAmountItemId,accountOptions:d,suggestions:f.suggestions,action:u,photos:c,onValidationFailed:r,saving:t||c.savingPhotos,saveDisabled:n,submitLabel:ee.saveEdit,onMerchantClick:f.merchantPicker.openPicker,readOnly:s,footer:(0,j.jsx)(D,{initialValues:o.initialValues,canWriteTransactions:o.canWriteTransactions,transactionItemSpecialStatusEnabled:o.transactionItemSpecialStatusEnabled})}),(0,j.jsx)(b,{picker:f.merchantPicker,merchants:o.merchantOptions,merchantTags:o.merchantTags,frequentMerchants:o.frequentMerchants})]})}var j,M,N,Ie=t((()=>{j=r(),M=e(n()),De(),g(),te(),de(),fe(),p(),y(),v(),Ne(),Ae(),je(),Pe(),N=`edit-transaction-receipt-form`,A.__docgenInfo={description:`编辑普通记录（#962）：显示预填的小票，删除按钮在保存下方。`,methods:[],displayName:`EditTransactionReceiptTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},archivedAccountOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:`已归档的付款账户（只读时用来显示账户名称与记录实际币种）。`},canDelete:{required:!0,tsType:{name:`boolean`},description:``},canWriteTransactions:{required:!0,tsType:{name:`boolean`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读小票（没有铅笔、×、保存）。`},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``},ledgerId:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},multiAccountPaymentEnabled:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}})),P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{P=r(),ae(),he(),T(),ge(),oe(),Ie(),ke(),{mocked:F,userEvent:I,within:L}=__STORYBOOK_MODULE_TEST__,R={items:[{amount:`800`,categoryId:`lunch`,specialStatus:null},{amount:`250`,categoryId:`coffee`,specialStatus:null}],merchantId:`seven`,note:`和同事一起`,payments:[{accountId:`paypay`,amount:null}],transactionAt:`2026-10-29T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},z={...R,items:[{amount:`1200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`lunch`,expectedUpdatedAt:`2026-10-29T03:21:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,reimbursementAmount:`1200`,specialStatus:`reimbursed`}]},B={title:`Templates/Transactions/EditTransactionReceipt`,component:A,beforeEach(){F(se).mockResolvedValue([])},decorators:[...pe,me,e=>(0,P.jsx)(Me,{children:(0,P.jsx)(e,{})})],args:{accountOptions:h.accounts,action:async()=>({}),canDelete:!0,canWriteTransactions:!0,categoryOptions:C.categoryOptions,deleteAction:async()=>({}),editRestriction:null,frequentMerchants:h.frequentMerchants,initialValues:R,ledgerId:`ledger-1`,merchantOptions:h.merchants,merchantTags:h.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!0},parameters:{viewport:{defaultViewport:`mobile2`}}},V={name:`编辑记账（预填小票）`},H={name:`编辑小票：点击保存后提示未填金额`,args:{initialValues:{...R,items:[{amount:``,categoryId:`lunch`,specialStatus:null}]}},play:async({canvasElement:e})=>{await I.click(L(e).getByRole(`button`,{name:`保存修改`}))}},U={name:`多账户付款`,args:{initialValues:{...R,payments:[{accountId:`paypay`,amount:`700`},{accountId:`cash`,amount:`350`}]}}},W={name:`小票商家抽屉（支持新增商家）`,play:async({canvasElement:e})=>{await I.click(await L(e).findByRole(`button`,{name:`修改商家：7-Eleven`}))}},G={name:`只读详情：他人创建的记录`,args:{canDelete:!1,editRestriction:`permission`}},K={name:`只读详情：账户已归档（可删除）`,args:{accountOptions:h.accounts.filter(e=>e.id!==`paypay`),archivedAccountOptions:h.accounts.filter(e=>e.id===`paypay`),editRestriction:`archivedAccount`}},q={name:`删除仍被子项关联的母项被拒绝`,args:{deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:ie.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:z},play:async({canvasElement:e})=>{let t=L(e);await I.click(await t.findByRole(`button`,{name:`删除`})),await I.click(await L(document.body).findByRole(`button`,{name:`删除`})),await L(document.body).findByText(`无法删除已关联明细`)}},J={name:`小票 · 退款 ¥1,980 / 抵消 ¥980 / 倒赚 ¥1,000`,args:{categoryOptions:w.categoryOptions,initialValues:{...R,type:`income`,items:w.items}}},Y={name:`编辑支出：退款入口`,args:{canWriteTransactions:!0}},X={name:`编辑支出：退款及报销入口`,args:{canWriteTransactions:!0,initialValues:{...R,items:[{...R.items[0],specialStatus:`pendingReimbursement`}]}}},Z={name:`只读支出：退款入口`,args:{canWriteTransactions:!0,editRestriction:`archivedAccount`}},Q={...X,name:`只读支出：退款及报销入口`,args:{...X.args,editRestriction:`permission`}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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