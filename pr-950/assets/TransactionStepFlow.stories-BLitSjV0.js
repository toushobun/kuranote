import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./Box-D4rJChY4.js";import{n as o,t as s}from"./Typography-CWKirwdW.js";import{n as c,t as l}from"./Button-BUz5fAjB.js";import{n as u,t as d}from"./DialogContent-BxqGx8le.js";import{n as f,r as p}from"./ConfirmDialogProvider-lGFgS9-v.js";import{n as m,t as h}from"./StepProgress-Cw9gQJCw.js";import{n as g,t as _}from"./WizardDialog-C_S2-LFl.js";import{n as v,t as y}from"./transactionStepFlowStoryUtils-DSG0NWs9.js";import{n as b,r as x}from"./transactionStepFlow-CPgFBk44.js";import{n as S,t as C}from"./AccountStep-BJ0tGPi-.js";import{n as w,t as T}from"./transactionStepFlowMessages-szgct42p.js";import{n as E,t as D}from"./EntryMethodDrawer-Bxl5qOYU.js";import{n as O,t as k}from"./MerchantAccountSummaryCard-CKOZ-ZvO.js";import{n as A,t as j}from"./MerchantStep-B6SWPQaQ.js";import{i as ee,n as M,r as N,t as P}from"./transactionItemsStep-re3qeqfb.js";import{n as F,t as I}from"./TransactionItemsStep-BWmeDtMb.js";function L(e){let t=p(),[n,r]=(0,R.useState)(e.initialAccountId),[i,a]=(0,R.useState)(e.initialStep??1),[o,s]=(0,R.useState)(e.initialCompletedSteps??[]),[c,l]=(0,R.useState)((e.initialStep??1)>=3),[u,d]=(0,R.useState)(null);i===3&&!c&&l(!0);let f=e.onItemsChange,m=(0,R.useCallback)(e=>{d(e),r(e.payments[0]?.accountId||void 0),f?.(e)},[f]),[h,g]=(0,R.useState)(!1),[_,v]=(0,R.useState)(!1),[y,b]=(0,R.useState)(e.initialMerchantId),x=e.merchants.find(e=>e.id===y),S=e.accounts.find(e=>e.id===n);function C(e){i===4&&e!==4&&g(!0),e===4&&g(!1),a(e)}function w(e){s(t=>t.includes(e)?t:[...t,e]),C(h?4:e+1)}function E(t){b(t.id),e.onMerchantSelect(t),s(e=>e.includes(1)?e:[...e,1]),a(2)}function D(t){r(t.id),e.onAccountSelect(t),h||w(2)}async function O(){await t({title:T.abandonTitle,description:T.abandonDescription,cancelLabel:T.continue,confirmLabel:T.abandon})&&e.onClose()}return{step:i,itemsStarted:c,itemsSnapshot:u,updateItemsSnapshot:m,completed:o,returning:h,methodOpen:_,setMethodOpen:v,merchant:x,account:S,goToStep:C,advance:w,selectMerchant:E,selectAccount:D,requestClose:O}}var R,z=t((()=>{R=e(n()),f(),w()}));function B(e){return e.open?(0,V.jsx)(te,{...e}):null}function te(e){let t=L(e);return(0,V.jsxs)(V.Fragment,{children:[(0,V.jsxs)(_,{open:e.open,onClose:()=>void t.requestClose(),closeLabel:T.close,title:T.title,titleAction:(0,V.jsx)(c,{size:`small`,onClick:()=>t.setMethodOpen(!0),children:T.switchMethod}),headerContent:(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(h,{currentStep:t.step,steps:T.steps,label:T.progress,completedSteps:t.completed,clickableSteps:[...t.completed,4],onStepClick:t.goToStep}),t.step>=2&&t.merchant&&(0,V.jsx)(k,{merchant:t.merchant,account:t.itemsSnapshot&&t.itemsSnapshot.payments.length>1?e.accounts.find(e=>e.id===t.itemsSnapshot?.payments[0]?.accountId):t.account,paymentAccountCount:t.itemsSnapshot?.payments.length??1,onMerchantChange:()=>t.goToStep(1),onAccountChange:()=>t.goToStep(2)})]}),children:[(0,V.jsxs)(u,{sx:{p:2.5,display:`flex`,flexDirection:`column`},children:[t.step===1&&(0,V.jsx)(j,{merchants:e.merchants,merchantTags:e.merchantTags,frequentMerchants:e.frequentMerchants,onSelect:t.selectMerchant,onAddMerchant:e.onAddMerchant,onAddPresets:e.onAddPresets}),t.step===2&&(0,V.jsx)(C,{accounts:e.accounts,recommendedAccountIds:e.suggestions?.recommendedAccountIds,selectedAccount:t.account,hasDetails:e.hasDetails||!!t.itemsSnapshot?.items.length,onSelect:t.selectAccount,onAddAccount:e.onAddAccount}),t.itemsStarted&&(0,V.jsx)(i,{hidden:t.step!==3,sx:{display:t.step===3?`flex`:`none`,flex:1,flexDirection:`column`},children:(0,V.jsx)(I,{...e.itemsOptions??H,accountOptions:e.accounts,selectedAccount:t.account,suggestions:e.suggestions,returning:t.returning,onConfirm:()=>t.advance(3),onChange:t.updateItemsSnapshot})}),t.step===4&&(0,V.jsx)(o,{children:T.confirmPlaceholder})]}),t.returning&&t.step!==3&&(0,V.jsx)(i,{sx:{p:2,pb:`max(16px, env(safe-area-inset-bottom))`},children:(0,V.jsx)(c,{fullWidth:!0,variant:`contained`,disabled:t.step===1&&!t.merchant||t.step===2&&!t.account,onClick:()=>t.advance(t.step),children:t.returning?T.returnToConfirm:T.toConfirm})})]}),(0,V.jsx)(D,{open:t.methodOpen,onClose:()=>t.setMethodOpen(!1),onMethodChange:e.onMethodChange})]})}var V,H,U=t((()=>{V=r(),F(),a(),l(),d(),s(),g(),m(),A(),S(),E(),O(),w(),z(),H={categoryOptions:[]},B.__docgenInfo={description:``,methods:[],displayName:`TransactionStepFlow`,props:{open:{required:!0,tsType:{name:`boolean`},description:``},merchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FlowMerchant`}],raw:`FlowMerchant[]`},description:``},merchantTags:{required:!0,tsType:{name:`Array`,elements:[{name:`MerchantTag`}],raw:`MerchantTag[]`},description:``},frequentMerchants:{required:!0,tsType:{name:`Array`,elements:[{name:`FrequentMerchant`}],raw:`FrequentMerchant[]`},description:``},accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},suggestions:{required:!1,tsType:{name:`MerchantEntrySuggestions`},description:``},itemsOptions:{required:!1,tsType:{name:`ItemsStepOptions`},description:``},onItemsChange:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(snapshot: ItemsStepSnapshot) => void`,signature:{arguments:[{type:{name:`ItemsStepSnapshot`},name:`snapshot`}],return:{name:`void`}}},description:``},hasDetails:{required:!1,tsType:{name:`boolean`},description:``},initialMerchantId:{required:!1,tsType:{name:`string`},description:``},initialAccountId:{required:!1,tsType:{name:`string`},description:``},initialStep:{required:!1,tsType:{name:`number`},description:``},initialCompletedSteps:{required:!1,tsType:{name:`Array`,elements:[{name:`number`}],raw:`number[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},onMethodChange:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(method: EntryMethod) => void`,signature:{arguments:[{type:{name:`EntryMethod`},name:`method`}],return:{name:`void`}}},description:``},onMerchantSelect:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(merchant: FlowMerchant) => void`,signature:{arguments:[{type:{name:`FlowMerchant`},name:`merchant`}],return:{name:`void`}}},description:``},onAccountSelect:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(account: TransactionAccountOption) => void`,signature:{arguments:[{type:{name:`TransactionAccountOption`},name:`account`}],return:{name:`void`}}},description:``},onAddMerchant:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(name?: string) => void`,signature:{arguments:[{type:{name:`string`},name:`name`}],return:{name:`void`}}},description:``},onAddPresets:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},onAddAccount:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``}}}})),W,G,K,q,J,Y,X,Z,Q,$;t((()=>{y(),M(),x(),U(),{userEvent:W,within:G}=__STORYBOOK_MODULE_TEST__,K={title:`Organisms/Transactions/TransactionStepFlow`,component:B,decorators:v,args:b,parameters:{viewport:{defaultViewport:`mobile2`}}},q={name:`商家默认（常用不足八个）`},J={name:`收支账户有推荐`,args:{initialStep:2,initialMerchantId:`seven`,initialCompletedSteps:[1]}},Y={name:`从确认页返回修改`,args:{initialStep:4,initialMerchantId:`seven`,initialAccountId:`paypay`,initialCompletedSteps:[1,2,3]},play:async({canvasElement:e})=>{await W.click(G(e.ownerDocument.body).getByRole(`button`,{name:`账户`}))}},X={name:`关闭确认`,play:async({canvasElement:e})=>{await W.click(G(e.ownerDocument.body).getByRole(`button`,{name:`关闭记账`}))}},Z={name:`明细步骤（自动预填）`,args:{initialStep:3,initialMerchantId:`seven`,initialAccountId:`paypay`,initialCompletedSteps:[1,2],suggestions:N.suggestions,itemsOptions:{...N,prefillAutomaticItems:!0}}},Q={name:`明细步骤（多账户付款）`,args:{...Z.args,itemsOptions:{...N,initialItems:P,initialPayments:ee}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "商家默认（常用不足八个）"
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "收支账户有推荐",
  args: {
    initialStep: 2,
    initialMerchantId: "seven",
    initialCompletedSteps: [1]
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "关闭确认",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "关闭记账"
    }));
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
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
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "明细步骤（多账户付款）",
  args: {
    ...ItemsStep.args,
    itemsOptions: {
      ...itemsStepFixture,
      initialItems: filledItems,
      initialPayments: twoPayments
    }
  }
}`,...Q.parameters?.docs?.source}}},$=[`MerchantDefault`,`RecommendedAccounts`,`ReturnFromConfirmation`,`CloseConfirmation`,`ItemsStep`,`SharedPayments`]}))();export{X as CloseConfirmation,Z as ItemsStep,q as MerchantDefault,J as RecommendedAccounts,Y as ReturnFromConfirmation,Q as SharedPayments,$ as __namedExportsOrder,K as default};