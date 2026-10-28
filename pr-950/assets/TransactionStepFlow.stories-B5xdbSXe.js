import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-K4eEfeBZ.js";import{n as i,t as a}from"./Typography-CWKirwdW.js";import{n as o,t as s}from"./Button-BUz5fAjB.js";import{n as c,t as l}from"./DialogContent-CuitjYa8.js";import{n as u,t as d}from"./StepProgress-fdkDZDNh.js";import{n as f,t as p}from"./WizardDialog-3-rsj5NJ.js";import{n as m,t as h}from"./transactionStepFlowStoryUtils-B5zTbt7a.js";import{n as g,r as _}from"./transactionStepFlow-CPgFBk44.js";import{n as v,t as y}from"./AccountStep-DReTQ_BN.js";import{n as b,t as x}from"./transactionStepFlowMessages-szgct42p.js";import{n as S,t as C}from"./EntryMethodDrawer-BUuYks_n.js";import{n as w,t as T}from"./MerchantAccountSummaryCard-vYqh_Vxb.js";import{n as E,t as D}from"./MerchantStep-Bb5H-9Ux.js";import{i as O,n as k,r as A,t as j}from"./transactionItemsStep-re3qeqfb.js";import{i as M,n as N,r as P,t as F}from"./useTransactionStepFlow-B_ytzpnW.js";function I(e){return e.open?(0,R.jsx)(L,{...e}):null}function L(e){let t=N(e);return(0,R.jsxs)(R.Fragment,{children:[(0,R.jsxs)(p,{open:e.open,onClose:()=>void t.requestClose(),closeLabel:x.close,title:x.title,titleAction:(0,R.jsx)(o,{size:`small`,onClick:()=>t.setMethodOpen(!0),children:x.switchMethod}),headerContent:(0,R.jsxs)(R.Fragment,{children:[(0,R.jsx)(d,{currentStep:t.step,steps:x.steps,label:x.progress,completedSteps:t.completed,clickableSteps:[...t.completed,4],onStepClick:t.goToStep}),t.step>=2&&t.merchant&&(0,R.jsx)(T,{merchant:t.merchant,account:t.account,paymentAccountCount:t.form.payments.length,onMerchantChange:()=>t.goToStep(1),onAccountChange:()=>t.goToStep(2)})]}),children:[(0,R.jsxs)(c,{sx:{p:2.5,display:`flex`,flexDirection:`column`},children:[t.step===1&&(0,R.jsx)(D,{merchants:e.merchants,merchantTags:e.merchantTags,frequentMerchants:e.frequentMerchants,onSelect:t.selectMerchant,onAddMerchant:e.onAddMerchant,onAddPresets:e.onAddPresets}),t.step===2&&(0,R.jsx)(y,{accounts:e.accounts,recommendedAccountIds:e.suggestions?.recommendedAccountIds,selectedAccount:t.account,hasDetails:e.hasDetails||!!t.form.itemSummaries.length,onSelect:t.selectAccount,onAddAccount:e.onAddAccount}),t.step===3&&(0,R.jsx)(P,{...t.itemsOptions,form:t.form,automaticItemIds:t.automaticItemIds,amountItemId:t.amountItemId,onAmountItemChange:t.setAmountItemId,accountOptions:e.accounts,suggestions:e.suggestions,returning:t.returning,onConfirm:()=>t.advance(3)}),t.step===4&&(0,R.jsx)(i,{children:x.confirmPlaceholder})]}),t.returning&&t.step!==3&&(0,R.jsx)(n,{sx:{p:2,pb:`max(16px, env(safe-area-inset-bottom))`},children:(0,R.jsx)(o,{fullWidth:!0,variant:`contained`,disabled:t.step===1&&!t.merchant||t.step===2&&!t.account,onClick:()=>t.advance(t.step),children:t.returning?x.returnToConfirm:x.toConfirm})})]}),(0,R.jsx)(C,{open:t.methodOpen,onClose:()=>t.setMethodOpen(!1),onMethodChange:e.onMethodChange})]})}var R,z=e((()=>{R=t(),M(),r(),s(),l(),a(),f(),u(),E(),v(),S(),w(),b(),F(),I.__docgenInfo={description:``,methods:[],displayName:`TransactionStepFlow`,props:{open:{required:!0,tsType:{name:`boolean`},description:``},merchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},suggestions:{required:!1,tsType:{name:`MerchantEntrySuggestions`},description:``},itemsOptions:{required:!1,tsType:{name:`ItemsStepOptions`},description:``},hasDetails:{required:!1,tsType:{name:`boolean`},description:``},initialMerchantId:{required:!1,tsType:{name:`string`},description:``},initialAccountId:{required:!1,tsType:{name:`string`},description:``},initialStep:{required:!1,tsType:{name:`number`},description:``},initialCompletedSteps:{required:!1,tsType:{name:`Array`,elements:[{name:`number`}],raw:`number[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},onMethodChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(method: EntryMethod) => void`,signature:{arguments:[{type:{name:`EntryMethod`},name:`method`}],return:{name:`void`}}},description:``},onMerchantSelect:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(merchant: FlowMerchant) => void`,signature:{arguments:[{type:{name:`FlowMerchant`},name:`merchant`}],return:{name:`void`}}},description:``},onAccountSelect:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(account: TransactionAccountOption) => void`,signature:{arguments:[{type:{name:`TransactionAccountOption`},name:`account`}],return:{name:`void`}}},description:``},onAddMerchant:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(name?: string) => void`,signature:{arguments:[{type:{name:`string`},name:`name`}],return:{name:`void`}}},description:``},onAddPresets:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},onAddAccount:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``}}}})),B,V,H,U,W,G,K,q,J,Y;e((()=>{h(),k(),_(),z(),{userEvent:B,within:V}=__STORYBOOK_MODULE_TEST__,H={title:`Organisms/Transactions/TransactionStepFlow`,component:I,decorators:m,args:g,parameters:{viewport:{defaultViewport:`mobile2`}}},U={name:`商家默认（常用不足八个）`},W={name:`收支账户有推荐`,args:{initialStep:2,initialMerchantId:`seven`,initialCompletedSteps:[1]}},G={name:`从确认页返回修改`,args:{initialStep:4,initialMerchantId:`seven`,initialAccountId:`paypay`,initialCompletedSteps:[1,2,3]},play:async({canvasElement:e})=>{await B.click(V(e.ownerDocument.body).getByRole(`button`,{name:`账户`}))}},K={name:`关闭确认`,play:async({canvasElement:e})=>{await B.click(V(e.ownerDocument.body).getByRole(`button`,{name:`关闭记账`}))}},q={name:`明细步骤（自动预填）`,args:{initialStep:3,initialMerchantId:`seven`,initialAccountId:`paypay`,initialCompletedSteps:[1,2],suggestions:A.suggestions,itemsOptions:{...A,prefillAutomaticItems:!0}}},J={name:`明细步骤（多账户付款）`,args:{...q.args,itemsOptions:{...A,initialItems:j,initialPayments:O}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "商家默认（常用不足八个）"
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "收支账户有推荐",
  args: {
    initialStep: 2,
    initialMerchantId: "seven",
    initialCompletedSteps: [1]
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "从确认页返回修改",
  args: {
    initialStep: 4,
    initialMerchantId: "seven",
    initialAccountId: "paypay",
    initialCompletedSteps: [1, 2, 3]
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "账户"
    }));
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "关闭确认",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "关闭记账"
    }));
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "明细步骤（自动预填）",
  args: {
    initialStep: 3,
    initialMerchantId: "seven",
    initialAccountId: "paypay",
    initialCompletedSteps: [1, 2],
    suggestions: itemsStepFixture.suggestions,
    itemsOptions: {
      ...itemsStepFixture,
      prefillAutomaticItems: true
    }
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "明细步骤（多账户付款）",
  args: {
    ...ItemsStep.args,
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: filledItems,
      initialPayments: twoPayments
    }
  }
}`,...J.parameters?.docs?.source}}},Y=[`MerchantDefault`,`RecommendedAccounts`,`ReturnFromConfirmation`,`CloseConfirmation`,`ItemsStep`,`SharedPayments`]}))();export{K as CloseConfirmation,q as ItemsStep,U as MerchantDefault,W as RecommendedAccounts,G as ReturnFromConfirmation,J as SharedPayments,Y as __namedExportsOrder,H as default};