import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionBottomEditorDrawer-DWAdMo-5.js";import{T as o,t as s}from"./transaction-uDwIDRHz.js";import{i as c,r as l}from"./AccountStep-DVG___e5.js";import{n as u,r as d}from"./transactionStepFlow-8icpKE4Y.js";import{n as f,t as p}from"./transactionStepFlowMessages-CDSpYuan.js";import{n as m,t as h}from"./MerchantStep-Cx0mI_1X.js";import{i as g,n as _,r as v,t as y}from"./useTransactionReceiptForm-rmtFcry5.js";import{i as b,t as x}from"./transactionReceipt-DV8lxRh3.js";import{a as S,i as C,n as w,o as T,r as E,t as D}from"./NewTransactionVisualFrame-BbUjN22J.js";import{n as O,t as k}from"./useMerchantEntrySuggestions-CZ0FXhBi.js";function A({accountOptions:e,initialValues:t,itemsOptions:n,ledgerId:r,merchantOptions:i,readOnly:a}){let o=_({accounts:e,merchants:i,itemsOptions:n,initialValues:t}),{suggestions:s,suggestionsMerchantId:c,loadSuggestions:l}=O({initialMerchantId:a?void 0:t.merchantId||void 0,ledgerId:r}),[u,d]=(0,j.useState)(!1);function f(e){o.form.handleMerchantChange(e.id),l(e.id),d(!1)}return{...o,suggestions:c===o.form.selectedMerchantId?s:void 0,merchantPickerOpen:u,openMerchantPicker:()=>d(!0),closeMerchantPicker:()=>d(!1),selectMerchant:f}}var j,M=t((()=>{j=e(n()),y(),k()}));function N(e){let t=C(e.action),n=e.initialValues.transactionRecordId;if(!n)throw Error(`transactionRecordId is required for edit transaction.`);return(0,F.jsx)(S,{canDelete:e.canDelete,deleteAction:e.deleteAction,editAction:t,editRestriction:e.editRestriction,hasLinkedIncomeItems:e.initialValues.items.some(e=>e.businessStatus?.incomeLinkRole!=null),saveFormId:I,transactionRecordId:n,children:(0,F.jsx)(P,{...e,formAction:t.formAction,saving:t.isPending})})}function P({formAction:e,saving:t,...n}){let r=n.editRestriction!==null,i=A({accountOptions:n.accountOptions,initialValues:n.initialValues,itemsOptions:{categoryOptions:n.categoryOptions,multiAccountPaymentEnabled:n.multiAccountPaymentEnabled,transactionItemSpecialStatusEnabled:n.transactionItemSpecialStatusEnabled},ledgerId:n.ledgerId,merchantOptions:n.merchantOptions,readOnly:r});return(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:I,name:`sourceType`,readOnly:!0,type:`hidden`,value:n.initialValues.type}),(0,F.jsx)(v,{...i.itemsOptions,form:i.form,formId:I,initialValues:n.initialValues,automaticItemIds:[],amountItemId:i.amountItemId,onAmountItemChange:i.setAmountItemId,accountOptions:n.accountOptions,suggestions:i.suggestions,action:e,saving:t,submitLabel:p.saveEdit,onBack:i.openMerchantPicker,readOnly:r}),(0,F.jsx)(a,{open:i.merchantPickerOpen,title:p.merchant,onClose:i.closeMerchantPicker,children:(0,F.jsx)(h,{merchants:n.merchantOptions,merchantTags:n.merchantTags,frequentMerchants:n.frequentMerchants,onSelect:i.selectMerchant})})]})}var F,I,L=t((()=>{F=r(),f(),i(),m(),g(),T(),M(),E(),I=`edit-transaction-receipt-form`,N.__docgenInfo={description:`编辑普通记录（#962）：显示预填的小票，删除按钮在保存下方。`,methods:[],displayName:`EditTransactionReceiptTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},canDelete:{required:!0,tsType:{name:`boolean`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读小票（没有铅笔、×、保存）。`},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``},ledgerId:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},multiAccountPaymentEnabled:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}})),R,z,B,V,H,U,W,G,K,q,J,Y,X;t((()=>{R=r(),s(),l(),x(),d(),L(),w(),{userEvent:z,within:B}=__STORYBOOK_MODULE_TEST__,V={items:[{amount:`800`,categoryId:`lunch`,specialStatus:null},{amount:`250`,categoryId:`coffee`,specialStatus:null}],merchantId:`seven`,note:`和同事一起`,payments:[{accountId:`paypay`,amount:null}],transactionAt:`2026-10-29T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},H={...V,items:[{amount:`1200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`lunch`,expectedUpdatedAt:`2026-10-29T03:21:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,reimbursementAmount:`1200`,specialStatus:`reimbursed`}]},U={title:`Templates/Transactions/EditTransactionReceipt`,component:N,decorators:[...c,e=>(0,R.jsx)(D,{children:(0,R.jsx)(e,{})})],args:{accountOptions:u.accounts,action:async()=>({}),canDelete:!0,categoryOptions:b.categoryOptions,deleteAction:async()=>({}),editRestriction:null,frequentMerchants:u.frequentMerchants,initialValues:V,ledgerId:`ledger-1`,merchantOptions:u.merchants,merchantTags:u.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!0},parameters:{viewport:{defaultViewport:`mobile2`}}},W={name:`编辑记账（预填小票）`},G={name:`多账户付款`,args:{initialValues:{...V,payments:[{accountId:`paypay`,amount:`700`},{accountId:`cash`,amount:`350`}]}}},K={name:`点商家换商家（没有新增商家入口）`,play:async({canvasElement:e})=>{await z.click(await B(e).findByRole(`button`,{name:`修改商家：7-Eleven`}))}},q={name:`只读详情：他人创建的记录`,args:{canDelete:!1,editRestriction:`permission`}},J={name:`只读详情：账户已归档（可删除）`,args:{accountOptions:u.accounts.filter(e=>e.id!==`paypay`),editRestriction:`archivedAccount`}},Y={name:`删除仍被子项关联的母项被拒绝`,args:{deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:o.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:H},play:async({canvasElement:e})=>{let t=B(e);await z.click(await t.findByRole(`button`,{name:`删除`})),await z.click(await B(document.body).findByRole(`button`,{name:`删除`})),await B(document.body).findByText(`无法删除已关联明细`)}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "编辑记账（预填小票）"
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
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
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "点商家换商家（没有新增商家入口）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", {
      name: "修改商家：7-Eleven"
    }));
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "只读详情：他人创建的记录",
  args: {
    canDelete: false,
    editRestriction: "permission"
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "只读详情：账户已归档（可删除）",
  args: {
    accountOptions: flowFixture.accounts.filter(account => account.id !== "paypay"),
    editRestriction: "archivedAccount"
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...Y.parameters?.docs?.source}}},X=[`Default`,`MultiAccount`,`ChangeMerchant`,`ReadOnlyPermission`,`ReadOnlyArchivedAccount`,`LinkedDeleteForbidden`]}))();export{K as ChangeMerchant,W as Default,Y as LinkedDeleteForbidden,G as MultiAccount,J as ReadOnlyArchivedAccount,q as ReadOnlyPermission,X as __namedExportsOrder,U as default};