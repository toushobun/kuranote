import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionRow-BEnFEmoG.js";var r,i,a,o;e((()=>{t(),r={component:n,title:`Molecules/Transactions/BalanceAdjustmentRow`,args:{item:{id:`adjustment`,type:`balance_adjustment`,amount:`2500`,account_name:`现金`,account_currency:`JPY`,transaction_at:`2026-09-14T00:00:00Z`,recorder_name:`淞文`,merchant_name:null,merchant_icon_url:null,categoryItems:[],note:`余额盘点`}}},i={name:`余额增加`},a={name:`余额减少`,args:{item:{...r.args.item,amount:`-2500`}}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "余额增加"
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "余额减少",
  args: {
    item: {
      ...meta.args.item,
      amount: "-2500"
    }
  }
}`,...a.parameters?.docs?.source}}},o=[`Increase`,`Decrease`]}))();export{a as Decrease,i as Increase,o as __namedExportsOrder,r as default};