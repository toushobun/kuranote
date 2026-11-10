import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./transactionStepFlowMessages-HVmT_9bI.js";import{n as i,r as a,t as o}from"./BackLayerScope-vaWDB49e.js";import{E as s,t as c}from"./transaction-6W44ZmEx.js";import{a as l,i as u,o as d,s as f}from"./AccountStep-CKQnziQK.js";import{n as p,r as m,t as h}from"./transactionStepFlowStoryUtils-BgkZPODR.js";import{n as g,r as _}from"./transactionStepFlow-jHa4zbU7.js";import{c as v,i as y,n as b,r as x,s as ee,t as te}from"./useReceiptMerchantPicker-BzGDKWvt.js";import{n as S,t as C}from"./ReceiptMerchantDrawer-Dej3nenC.js";import{n as w,t as T}from"./useMerchantEntrySuggestions-hMQJ3cip.js";import{i as E,t as D}from"./transactionReceipt-BN12jKlD.js";import{a as O,i as k,n as ne,o as A,r as j,t as M}from"./NewTransactionVisualFrame-IUREf9kP.js";function N({accountOptions:e,initialValues:t,itemsOptions:n,ledgerId:r,merchantOptions:i,readOnly:a}){let o=y({accounts:e,merchants:i,itemsOptions:n,initialValues:t}),{suggestions:s,suggestionsMerchantId:c,loadSuggestions:l}=w({initialMerchantId:a?void 0:t.merchantId||void 0,ledgerId:r}),u=b(d);function d(e){o.form.handleMerchantChange(e.id),l(e.id)}return{...o,suggestions:c===o.form.selectedMerchantId?s:void 0,merchantPicker:u}}var P=e((()=>{te(),x(),T()}));function F(e){let t=e.initialValues.transactionRecordId;if(!t)throw Error(`transactionRecordId is required for edit transaction.`);return(0,L.jsx)(o,{level:a.receiptEditor,children:(0,L.jsx)(O,{action:e.action,canDelete:e.canDelete,deleteAction:e.deleteAction,editRestriction:e.editRestriction,hasLinkedIncomeItems:e.initialValues.items.some(e=>e.businessStatus?.incomeLinkRole!=null),saveFormId:R,transactionRecordId:t,children:t=>(0,L.jsx)(I,{...e,formAction:t.formAction,saving:t.isPending,onValidationFailed:t.onValidationFailed})})})}function I({formAction:e,saving:t,onValidationFailed:n,...i}){let a=l(),o={...i,merchantOptions:f(i.merchantOptions,a?.merchants),accountOptions:f(i.accountOptions,a?.accounts)},s=o.editRestriction!==null,c=k(o.accountOptions,o.archivedAccountOptions),u=N({accountOptions:c,initialValues:o.initialValues,itemsOptions:{categoryOptions:o.categoryOptions,multiAccountPaymentEnabled:o.multiAccountPaymentEnabled,transactionItemSpecialStatusEnabled:o.transactionItemSpecialStatusEnabled},ledgerId:o.ledgerId,merchantOptions:o.merchantOptions,readOnly:s});return(0,L.jsxs)(L.Fragment,{children:[(0,L.jsx)(`input`,{form:R,name:`sourceType`,readOnly:!0,type:`hidden`,value:o.initialValues.type}),(0,L.jsx)(ee,{...u.itemsOptions,form:u.form,formId:R,initialValues:o.initialValues,amountItemId:u.amountItemId,onAmountItemChange:u.setAmountItemId,accountOptions:c,suggestions:u.suggestions,action:e,onValidationFailed:n,saving:t,submitLabel:r.saveEdit,onMerchantClick:u.merchantPicker.openPicker,readOnly:s}),(0,L.jsx)(C,{picker:u.merchantPicker,merchants:o.merchantOptions,merchantTags:o.merchantTags,frequentMerchants:o.frequentMerchants})]})}var L,R,z=e((()=>{L=t(),i(),u(),d(),n(),S(),v(),A(),j(),P(),R=`edit-transaction-receipt-form`,F.__docgenInfo={description:`编辑普通记录（#962）：显示预填的小票，删除按钮在保存下方。`,methods:[],displayName:`EditTransactionReceiptTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},archivedAccountOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:`已归档的付款账户（只读时用来显示账户名称与记录实际币种）。`},canDelete:{required:!0,tsType:{name:`boolean`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读小票（没有铅笔、×、保存）。`},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``},ledgerId:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},multiAccountPaymentEnabled:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}})),B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{B=t(),c(),h(),D(),_(),z(),ne(),{userEvent:V,within:H}=__STORYBOOK_MODULE_TEST__,U={items:[{amount:`800`,categoryId:`lunch`,specialStatus:null},{amount:`250`,categoryId:`coffee`,specialStatus:null}],merchantId:`seven`,note:`和同事一起`,payments:[{accountId:`paypay`,amount:null}],transactionAt:`2026-10-29T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},W={...U,items:[{amount:`1200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`lunch`,expectedUpdatedAt:`2026-10-29T03:21:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,reimbursementAmount:`1200`,specialStatus:`reimbursed`}]},G={title:`Templates/Transactions/EditTransactionReceipt`,component:F,decorators:[...m,p,e=>(0,B.jsx)(M,{children:(0,B.jsx)(e,{})})],args:{accountOptions:g.accounts,action:async()=>({}),canDelete:!0,categoryOptions:E.categoryOptions,deleteAction:async()=>({}),editRestriction:null,frequentMerchants:g.frequentMerchants,initialValues:U,ledgerId:`ledger-1`,merchantOptions:g.merchants,merchantTags:g.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!0},parameters:{viewport:{defaultViewport:`mobile2`}}},K={name:`编辑记账（预填小票）`},q={name:`编辑小票：点击保存后提示未填金额`,args:{initialValues:{...U,items:[{amount:``,categoryId:`lunch`,specialStatus:null}]}},play:async({canvasElement:e})=>{await V.click(H(e).getByRole(`button`,{name:`保存修改`}))}},J={name:`多账户付款`,args:{initialValues:{...U,payments:[{accountId:`paypay`,amount:`700`},{accountId:`cash`,amount:`350`}]}}},Y={name:`小票商家抽屉（支持新增商家）`,play:async({canvasElement:e})=>{await V.click(await H(e).findByRole(`button`,{name:`修改商家：7-Eleven`}))}},X={name:`只读详情：他人创建的记录`,args:{canDelete:!1,editRestriction:`permission`}},Z={name:`只读详情：账户已归档（可删除）`,args:{accountOptions:g.accounts.filter(e=>e.id!==`paypay`),archivedAccountOptions:g.accounts.filter(e=>e.id===`paypay`),editRestriction:`archivedAccount`}},Q={name:`删除仍被子项关联的母项被拒绝`,args:{deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:s.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:W},play:async({canvasElement:e})=>{let t=H(e);await V.click(await t.findByRole(`button`,{name:`删除`})),await V.click(await H(document.body).findByRole(`button`,{name:`删除`})),await H(document.body).findByText(`无法删除已关联明细`)}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "编辑记账（预填小票）"
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "小票商家抽屉（支持新增商家）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", {
      name: "修改商家：7-Eleven"
    }));
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "只读详情：他人创建的记录",
  args: {
    canDelete: false,
    editRestriction: "permission"
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "只读详情：账户已归档（可删除）",
  args: {
    accountOptions: flowFixture.accounts.filter(account => account.id !== "paypay"),
    archivedAccountOptions: flowFixture.accounts.filter(account => account.id === "paypay"),
    editRestriction: "archivedAccount"
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`InvalidAfterSave`,`MultiAccount`,`ChangeMerchant`,`ReadOnlyPermission`,`ReadOnlyArchivedAccount`,`LinkedDeleteForbidden`]}))();export{Y as ChangeMerchant,K as Default,q as InvalidAfterSave,Q as LinkedDeleteForbidden,J as MultiAccount,Z as ReadOnlyArchivedAccount,X as ReadOnlyPermission,$ as __namedExportsOrder,G as default};