import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./transactionStepFlowMessages-CHeastu4.js";import{n as i,r as a,t as o}from"./BackLayerScope-B2tI4G28.js";import{j as s,t as c}from"./transaction-BLWVfymb.js";import{a as l,i as u,o as d,s as f}from"./AccountStep-CiQpwHrN.js";import{a as p,i as m,n as h}from"./transactionStepFlowStoryUtils-Cs20jr_8.js";import{n as g,r as _}from"./transactionStepFlow-BdbS7D1i.js";import{c as v,i as y,n as ee,r as te,s as ne,t as re}from"./useReceiptMerchantPicker-ByuH2yKF.js";import{n as ie,t as b}from"./ReceiptMerchantDrawer-mLlNis6l.js";import{n as x,t as S}from"./useMerchantEntrySuggestions-CDHJASnd.js";import{i as C,t as w}from"./transactionReceipt-BN12jKlD.js";import{l as T,n as E}from"./transactionLinkCandidateFixtures-agSwjIEl.js";import{a as D,i as O,n as ae,o as k,r as A,t as j}from"./NewTransactionVisualFrame-Bh0F7WjC.js";function M({accountOptions:e,initialValues:t,itemsOptions:n,ledgerId:r,merchantOptions:i,readOnly:a}){let o=y({accounts:e,merchants:i,itemsOptions:n,initialValues:t}),{suggestions:s,suggestionsMerchantId:c,selectSuggestionMerchant:l}=x({initialMerchantId:a?void 0:t.merchantId||void 0,ledgerId:r}),u=ee(d);function d(e){o.form.handleMerchantChange(e.id),l(e)}return{...o,suggestions:c===o.form.selectedMerchantId?s:void 0,merchantPicker:u}}var N=e((()=>{re(),te(),S()}));function P(e){let t=e.initialValues.transactionRecordId;if(!t)throw Error(`transactionRecordId is required for edit transaction.`);return(0,I.jsx)(o,{level:a.receiptEditor,children:(0,I.jsx)(D,{action:e.action,canDelete:e.canDelete,deleteAction:e.deleteAction,editRestriction:e.editRestriction,hasLinkedIncomeItems:e.initialValues.items.some(e=>e.businessStatus?.incomeLinkRole!=null),initialLinkedTargets:e.initialValues.items.flatMap(e=>{if(!e.id||!e.businessStatus?.incomeLinkRole)return[];let t=e.businessStatus.incomeLinkRole===`refund`?e.refundCandidate:e.reimbursementCandidate;return t?[{incomeItemId:e.id,kind:e.businessStatus.incomeLinkRole,label:t.categoryName,currency:t.accountCurrency,surplus:e.businessNetAmount??e.amount,targetItemId:t.id}]:[]}),saveFormId:L,transactionRecordId:t,children:t=>(0,I.jsx)(F,{...e,formAction:t.formAction,saving:t.isPending,onValidationFailed:t.onValidationFailed})})})}function F({formAction:e,saving:t,onValidationFailed:n,...i}){let a=l(),o={...i,merchantOptions:f(i.merchantOptions,a?.merchants),accountOptions:f(i.accountOptions,a?.accounts)},s=o.editRestriction!==null,c=O(o.accountOptions,o.archivedAccountOptions),u=M({accountOptions:c,initialValues:o.initialValues,itemsOptions:{categoryOptions:o.categoryOptions,multiAccountPaymentEnabled:o.multiAccountPaymentEnabled,transactionItemSpecialStatusEnabled:o.transactionItemSpecialStatusEnabled},ledgerId:o.ledgerId,merchantOptions:o.merchantOptions,readOnly:s});return(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:L,name:`sourceType`,readOnly:!0,type:`hidden`,value:o.initialValues.type}),(0,I.jsx)(ne,{...u.itemsOptions,form:u.form,formId:L,initialValues:o.initialValues,amountItemId:u.amountItemId,onAmountItemChange:u.setAmountItemId,accountOptions:c,suggestions:u.suggestions,action:e,onValidationFailed:n,saving:t,submitLabel:r.saveEdit,onMerchantClick:u.merchantPicker.openPicker,readOnly:s}),(0,I.jsx)(b,{picker:u.merchantPicker,merchants:o.merchantOptions,merchantTags:o.merchantTags,frequentMerchants:o.frequentMerchants})]})}var I,L,R=e((()=>{I=t(),i(),u(),d(),n(),ie(),v(),k(),A(),N(),L=`edit-transaction-receipt-form`,P.__docgenInfo={description:`编辑普通记录（#962）：显示预填的小票，删除按钮在保存下方。`,methods:[],displayName:`EditTransactionReceiptTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},archivedAccountOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:`已归档的付款账户（只读时用来显示账户名称与记录实际币种）。`},canDelete:{required:!0,tsType:{name:`boolean`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读小票（没有铅笔、×、保存）。`},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``},ledgerId:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},multiAccountPaymentEnabled:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}}})),z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{z=t(),c(),h(),w(),E(),_(),R(),ae(),{userEvent:B,within:V}=__STORYBOOK_MODULE_TEST__,H={items:[{amount:`800`,categoryId:`lunch`,specialStatus:null},{amount:`250`,categoryId:`coffee`,specialStatus:null}],merchantId:`seven`,note:`和同事一起`,payments:[{accountId:`paypay`,amount:null}],transactionAt:`2026-10-29T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},U={...H,items:[{amount:`1200`,businessNetAmount:`0`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`lunch`,expectedUpdatedAt:`2026-10-29T03:21:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,reimbursementAmount:`1200`,specialStatus:`reimbursed`}]},W={title:`Templates/Transactions/EditTransactionReceipt`,component:P,decorators:[...p,m,e=>(0,z.jsx)(j,{children:(0,z.jsx)(e,{})})],args:{accountOptions:g.accounts,action:async()=>({}),canDelete:!0,categoryOptions:C.categoryOptions,deleteAction:async()=>({}),editRestriction:null,frequentMerchants:g.frequentMerchants,initialValues:H,ledgerId:`ledger-1`,merchantOptions:g.merchants,merchantTags:g.merchantTags,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!0},parameters:{viewport:{defaultViewport:`mobile2`}}},G={name:`编辑记账（预填小票）`},K={name:`编辑小票：点击保存后提示未填金额`,args:{initialValues:{...H,items:[{amount:``,categoryId:`lunch`,specialStatus:null}]}},play:async({canvasElement:e})=>{await B.click(V(e).getByRole(`button`,{name:`保存修改`}))}},q={name:`多账户付款`,args:{initialValues:{...H,payments:[{accountId:`paypay`,amount:`700`},{accountId:`cash`,amount:`350`}]}}},J={name:`小票商家抽屉（支持新增商家）`,play:async({canvasElement:e})=>{await B.click(await V(e).findByRole(`button`,{name:`修改商家：7-Eleven`}))}},Y={name:`只读详情：他人创建的记录`,args:{canDelete:!1,editRestriction:`permission`}},X={name:`只读详情：账户已归档（可删除）`,args:{accountOptions:g.accounts.filter(e=>e.id!==`paypay`),archivedAccountOptions:g.accounts.filter(e=>e.id===`paypay`),editRestriction:`archivedAccount`}},Z={name:`删除仍被子项关联的母项被拒绝`,args:{deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:s.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:U},play:async({canvasElement:e})=>{let t=V(e);await B.click(await t.findByRole(`button`,{name:`删除`})),await B.click(await V(document.body).findByRole(`button`,{name:`删除`})),await V(document.body).findByText(`无法删除已关联明细`)}},Q={name:`小票 · 退款 ¥1,980 / 抵消 ¥980 / 倒赚 ¥1,000`,args:{categoryOptions:[...C.categoryOptions,{id:`refund-system`,name:`退款`,parentId:`special-income`,parentName:`特殊收入`,systemKey:`refund`,type:`income`}],initialValues:{...H,type:`income`,items:[{amount:`1980`,businessNetAmount:`1000`,businessStatus:{incomeLinkRole:`refund`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null,surplusAmount:`1000`},categoryId:`refund-system`,refundCandidate:{...T,remainingRefundableAmount:`980`},specialStatus:null}]}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "编辑记账（预填小票）"
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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
  name: "小票商家抽屉（支持新增商家）",
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
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "小票 · 退款 ¥1,980 / 抵消 ¥980 / 倒赚 ¥1,000",
  args: {
    categoryOptions: [...receiptItemsOptions.categoryOptions, {
      id: "refund-system",
      name: "退款",
      parentId: "special-income",
      parentName: "特殊收入",
      systemKey: "refund",
      type: "income"
    }],
    initialValues: {
      ...initialValues,
      type: "income",
      items: [{
        amount: "1980",
        businessNetAmount: "1000",
        businessStatus: {
          incomeLinkRole: "refund",
          offsetComposition: {
            refundAmount: "0",
            reimbursementAmount: "0"
          },
          settlementStatus: null,
          surplusAmount: "1000"
        },
        categoryId: "refund-system",
        refundCandidate: {
          ...selectedCandidate,
          remainingRefundableAmount: "980"
        },
        specialStatus: null
      }]
    }
  }
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`InvalidAfterSave`,`MultiAccount`,`ChangeMerchant`,`ReadOnlyPermission`,`ReadOnlyArchivedAccount`,`LinkedDeleteForbidden`,`RefundSurplusReceipt1078`]}))();export{J as ChangeMerchant,G as Default,K as InvalidAfterSave,Z as LinkedDeleteForbidden,q as MultiAccount,X as ReadOnlyArchivedAccount,Y as ReadOnlyPermission,Q as RefundSurplusReceipt1078,$ as __namedExportsOrder,W as default};