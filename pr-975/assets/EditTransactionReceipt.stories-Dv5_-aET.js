import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionBottomEditorDrawer-DcQwLgGF.js";import{T as o,t as s}from"./transaction-Cj6b3VtP.js";import{i as c,r as l}from"./AccountStep-C9NHB5oE.js";import{n as u,r as d}from"./transactionStepFlow-8icpKE4Y.js";import{n as f,t as p}from"./transactionStepFlowMessages-CDSpYuan.js";import{n as m,t as h}from"./MerchantStep-CkH5b6jZ.js";import{i as g,n as _,r as v,t as y}from"./useTransactionReceiptForm-4Woo8b1X.js";import{i as b,t as x}from"./transactionReceipt-_WJeF04t.js";import{a as S,c as C,i as w,n as T,o as E,r as D,s as O,t as k}from"./NewTransactionVisualFrame-CejD9FCH.js";import{n as A,t as j}from"./useMerchantEntrySuggestions-CqYBUnAa.js";function M({accountOptions:e,initialValues:t,itemsOptions:n,ledgerId:r,merchantOptions:i,readOnly:a}){let o=_({accounts:e,merchants:i,itemsOptions:n,initialValues:t}),{suggestions:s,suggestionsMerchantId:c,loadSuggestions:l}=A({initialMerchantId:a?void 0:t.merchantId||void 0,ledgerId:r}),[u,d]=(0,N.useState)(!1);function f(e){o.form.handleMerchantChange(e.id),l(e.id),d(!1)}return{...o,suggestions:c===o.form.selectedMerchantId?s:void 0,merchantPickerOpen:u,openMerchantPicker:()=>d(!0),closeMerchantPicker:()=>d(!1),selectMerchant:f}}var N,P=t((()=>{N=e(n()),y(),j()}));function F(e){let t=w(e.action),n=e.initialValues.transactionRecordId;if(!n)throw Error(`transactionRecordId is required for edit transaction.`);return(0,L.jsx)(O,{canDelete:e.canDelete,deleteAction:e.deleteAction,editAction:t,editRestriction:e.editRestriction,hasLinkedIncomeItems:e.initialValues.items.some(e=>e.businessStatus?.incomeLinkRole!=null),saveFormId:R,transactionRecordId:n,children:(0,L.jsx)(I,{...e,formAction:t.formAction,saving:t.isPending})})}function I({formAction:e,saving:t,...n}){let r=n.editRestriction!==null,i=E(n.accountOptions,n.archivedAccountOptions),o=M({accountOptions:i,initialValues:n.initialValues,itemsOptions:{categoryOptions:n.categoryOptions,multiAccountPaymentEnabled:n.multiAccountPaymentEnabled,transactionItemSpecialStatusEnabled:n.transactionItemSpecialStatusEnabled},ledgerId:n.ledgerId,merchantOptions:n.merchantOptions,readOnly:r});return(0,L.jsxs)(L.Fragment,{children:[(0,L.jsx)(`input`,{form:R,name:`sourceType`,readOnly:!0,type:`hidden`,value:n.initialValues.type}),(0,L.jsx)(v,{...o.itemsOptions,form:o.form,formId:R,initialValues:n.initialValues,automaticItemIds:[],amountItemId:o.amountItemId,onAmountItemChange:o.setAmountItemId,accountOptions:i,suggestions:o.suggestions,action:e,saving:t,submitLabel:p.saveEdit,onBack:o.openMerchantPicker,readOnly:r}),(0,L.jsx)(a,{open:o.merchantPickerOpen,title:p.merchant,onClose:o.closeMerchantPicker,children:(0,L.jsx)(h,{merchants:n.merchantOptions,merchantTags:n.merchantTags,frequentMerchants:n.frequentMerchants,onSelect:o.selectMerchant})})]})}var L,R,z=t((()=>{L=r(),f(),i(),m(),g(),C(),S(),P(),D(),R=`edit-transaction-receipt-form`,F.__docgenInfo={description:`编辑普通记录（#962）：显示预填的小票，删除按钮在保存下方。`,methods:[],displayName:`EditTransactionReceiptTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},archivedAccountOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:`已归档的付款账户（只读时用来显示账户名称与记录实际币种）。`},canDelete:{required:!0,tsType:{name:`boolean`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读小票（没有铅笔、×、保存）。`},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``},ledgerId:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},multiAccountPaymentEnabled:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}})),B,V,H,U,W,G,K,q,J,Y,X,Z,Q;t((()=>{B=r(),s(),l(),x(),d(),z(),T(),{userEvent:V,within:H}=__STORYBOOK_MODULE_TEST__,U={items:[{amount:`800`,categoryId:`lunch`,specialStatus:null},{amount:`250`,categoryId:`coffee`,specialStatus:null}],merchantId:`seven`,note:`和同事一起`,payments:[{accountId:`paypay`,amount:null}],transactionAt:`2026-10-29T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},W={...U,items:[{amount:`1200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`lunch`,expectedUpdatedAt:`2026-10-29T03:21:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,reimbursementAmount:`1200`,specialStatus:`reimbursed`}]},G={title:`Templates/Transactions/EditTransactionReceipt`,component:F,decorators:[...c,e=>(0,B.jsx)(k,{children:(0,B.jsx)(e,{})})],args:{accountOptions:u.accounts,action:async()=>({}),canDelete:!0,categoryOptions:b.categoryOptions,deleteAction:async()=>({}),editRestriction:null,frequentMerchants:u.frequentMerchants,initialValues:U,ledgerId:`ledger-1`,merchantOptions:u.merchants,merchantTags:u.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!0},parameters:{viewport:{defaultViewport:`mobile2`}}},K={name:`编辑记账（预填小票）`},q={name:`多账户付款`,args:{initialValues:{...U,payments:[{accountId:`paypay`,amount:`700`},{accountId:`cash`,amount:`350`}]}}},J={name:`点商家换商家（没有新增商家入口）`,play:async({canvasElement:e})=>{await V.click(await H(e).findByRole(`button`,{name:`修改商家：7-Eleven`}))}},Y={name:`只读详情：他人创建的记录`,args:{canDelete:!1,editRestriction:`permission`}},X={name:`只读详情：账户已归档（可删除）`,args:{accountOptions:u.accounts.filter(e=>e.id!==`paypay`),archivedAccountOptions:u.accounts.filter(e=>e.id===`paypay`),editRestriction:`archivedAccount`}},Z={name:`删除仍被子项关联的母项被拒绝`,args:{deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:o.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:W},play:async({canvasElement:e})=>{let t=H(e);await V.click(await t.findByRole(`button`,{name:`删除`})),await V.click(await H(document.body).findByRole(`button`,{name:`删除`})),await H(document.body).findByText(`无法删除已关联明细`)}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "编辑记账（预填小票）"
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "点商家换商家（没有新增商家入口）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", {
      name: "修改商家：7-Eleven"
    }));
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "只读详情：他人创建的记录",
  args: {
    canDelete: false,
    editRestriction: "permission"
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "只读详情：账户已归档（可删除）",
  args: {
    accountOptions: flowFixture.accounts.filter(account => account.id !== "paypay"),
    archivedAccountOptions: flowFixture.accounts.filter(account => account.id === "paypay"),
    editRestriction: "archivedAccount"
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
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
}`,...Z.parameters?.docs?.source}}},Q=[`Default`,`MultiAccount`,`ChangeMerchant`,`ReadOnlyPermission`,`ReadOnlyArchivedAccount`,`LinkedDeleteForbidden`]}))();export{J as ChangeMerchant,K as Default,Z as LinkedDeleteForbidden,q as MultiAccount,X as ReadOnlyArchivedAccount,Y as ReadOnlyPermission,Q as __namedExportsOrder,G as default};