import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./transactionStepFlowMessages-B3NW0_ky.js";import{n as o,t as s}from"./TransactionBottomEditorDrawer-DKeLKWlG.js";import{T as c,t as l}from"./transaction-CKHJwqYv.js";import{i as u,r as d}from"./AccountStep-Cg7LTXmj.js";import{n as f,r as p}from"./transactionStepFlow-8icpKE4Y.js";import{n as m,t as h}from"./MerchantStep-Vh8oq3lW.js";import{c as g,i as _,l as v,n as y,o as b,r as x,s as ee,t as te}from"./useTransactionReceiptForm-fWFnk9pR.js";import{i as S,t as C}from"./transactionReceipt-LK8bFAuS.js";import{n as w,t as T}from"./useMerchantEntrySuggestions-CgGBFXJJ.js";import{a as E,c as D,i as O,n as k,o as ne,r as A,s as j,t as M}from"./NewTransactionVisualFrame-CpM9WfXy.js";function N({accountOptions:e,initialValues:t,itemsOptions:n,ledgerId:r,merchantOptions:i,readOnly:a}){let o=y({accounts:e,merchants:i,itemsOptions:n,initialValues:t}),{suggestions:s,suggestionsMerchantId:c,loadSuggestions:l}=w({initialMerchantId:a?void 0:t.merchantId||void 0,ledgerId:r}),[u,d]=(0,P.useState)(!1);function f(e){o.form.handleMerchantChange(e.id),l(e.id),d(!1)}return{...o,suggestions:c===o.form.selectedMerchantId?s:void 0,merchantPickerOpen:u,openMerchantPicker:()=>d(!0),closeMerchantPicker:()=>d(!1),selectMerchant:f}}var P,F=t((()=>{P=e(n()),te(),T()}));function I(e){let t=O(e.action),n=e.initialValues.transactionRecordId;if(!n)throw Error(`transactionRecordId is required for edit transaction.`);return(0,R.jsx)(j,{canDelete:e.canDelete,deleteAction:e.deleteAction,editAction:t,editRestriction:e.editRestriction,hasLinkedIncomeItems:e.initialValues.items.some(e=>e.businessStatus?.incomeLinkRole!=null),saveFormId:z,transactionRecordId:n,children:(0,R.jsx)(L,{...e,formAction:t.formAction,saving:t.isPending})})}function L({formAction:e,saving:t,...n}){let r=ee(),i={...n,merchantOptions:v(n.merchantOptions,r?.merchants),accountOptions:v(n.accountOptions,r?.accounts)},o=i.editRestriction!==null,c=ne(i.accountOptions,i.archivedAccountOptions),l=N({accountOptions:c,initialValues:i.initialValues,itemsOptions:{categoryOptions:i.categoryOptions,multiAccountPaymentEnabled:i.multiAccountPaymentEnabled,transactionItemSpecialStatusEnabled:i.transactionItemSpecialStatusEnabled},ledgerId:i.ledgerId,merchantOptions:i.merchantOptions,readOnly:o});return(0,R.jsxs)(R.Fragment,{children:[(0,R.jsx)(`input`,{form:z,name:`sourceType`,readOnly:!0,type:`hidden`,value:i.initialValues.type}),(0,R.jsx)(x,{...l.itemsOptions,form:l.form,formId:z,initialValues:i.initialValues,automaticItemIds:[],amountItemId:l.amountItemId,onAmountItemChange:l.setAmountItemId,accountOptions:c,suggestions:l.suggestions,action:e,saving:t,submitLabel:a.saveEdit,onBack:l.openMerchantPicker,readOnly:o}),(0,R.jsx)(s,{open:l.merchantPickerOpen,suspended:!!r?.editor,title:a.merchant,onClose:l.closeMerchantPicker,children:(0,R.jsx)(h,{merchants:i.merchantOptions,merchantTags:i.merchantTags,frequentMerchants:i.frequentMerchants,onSelect:l.selectMerchant,onAddMerchant:!o&&r?.addMerchant?e=>r.addMerchant?.(l.selectMerchant,e):void 0})})]})}var R,z,B=t((()=>{R=r(),b(),g(),i(),o(),m(),_(),D(),E(),F(),A(),z=`edit-transaction-receipt-form`,I.__docgenInfo={description:`编辑普通记录（#962）：显示预填的小票，删除按钮在保存下方。`,methods:[],displayName:`EditTransactionReceiptTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},archivedAccountOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:`已归档的付款账户（只读时用来显示账户名称与记录实际币种）。`},canDelete:{required:!0,tsType:{name:`boolean`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读小票（没有铅笔、×、保存）。`},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``},ledgerId:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},multiAccountPaymentEnabled:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}})),V,H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{V=r(),l(),d(),C(),p(),B(),k(),{userEvent:H,within:U}=__STORYBOOK_MODULE_TEST__,W={items:[{amount:`800`,categoryId:`lunch`,specialStatus:null},{amount:`250`,categoryId:`coffee`,specialStatus:null}],merchantId:`seven`,note:`和同事一起`,payments:[{accountId:`paypay`,amount:null}],transactionAt:`2026-10-29T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},G={...W,items:[{amount:`1200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`lunch`,expectedUpdatedAt:`2026-10-29T03:21:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,reimbursementAmount:`1200`,specialStatus:`reimbursed`}]},K={title:`Templates/Transactions/EditTransactionReceipt`,component:I,decorators:[...u,e=>(0,V.jsx)(M,{children:(0,V.jsx)(e,{})})],args:{accountOptions:f.accounts,action:async()=>({}),canDelete:!0,categoryOptions:S.categoryOptions,deleteAction:async()=>({}),editRestriction:null,frequentMerchants:f.frequentMerchants,initialValues:W,ledgerId:`ledger-1`,merchantOptions:f.merchants,merchantTags:f.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!0},parameters:{viewport:{defaultViewport:`mobile2`}}},q={name:`编辑记账（预填小票）`},J={name:`多账户付款`,args:{initialValues:{...W,payments:[{accountId:`paypay`,amount:`700`},{accountId:`cash`,amount:`350`}]}}},Y={name:`点商家换商家（没有新增商家入口）`,play:async({canvasElement:e})=>{await H.click(await U(e).findByRole(`button`,{name:`修改商家：7-Eleven`}))}},X={name:`只读详情：他人创建的记录`,args:{canDelete:!1,editRestriction:`permission`}},Z={name:`只读详情：账户已归档（可删除）`,args:{accountOptions:f.accounts.filter(e=>e.id!==`paypay`),archivedAccountOptions:f.accounts.filter(e=>e.id===`paypay`),editRestriction:`archivedAccount`}},Q={name:`删除仍被子项关联的母项被拒绝`,args:{deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:c.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:G},play:async({canvasElement:e})=>{let t=U(e);await H.click(await t.findByRole(`button`,{name:`删除`})),await H.click(await U(document.body).findByRole(`button`,{name:`删除`})),await U(document.body).findByText(`无法删除已关联明细`)}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "编辑记账（预填小票）"
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
  name: "点商家换商家（没有新增商家入口）",
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
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`MultiAccount`,`ChangeMerchant`,`ReadOnlyPermission`,`ReadOnlyArchivedAccount`,`LinkedDeleteForbidden`]}))();export{Y as ChangeMerchant,q as Default,Q as LinkedDeleteForbidden,J as MultiAccount,Z as ReadOnlyArchivedAccount,X as ReadOnlyPermission,$ as __namedExportsOrder,K as default};