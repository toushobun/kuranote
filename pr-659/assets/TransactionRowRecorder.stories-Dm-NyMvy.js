import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-Bb8BPmfO.js";import{n as i,t as a}from"./TransactionRow-ANB5yWdZ.js";var o,s,c,l,u,d;e((()=>{o=t(),r(),i(),s={account_color:`sakura`,account_currency:`JPY`,account_name:`日元现金`,amount:`1200`,categoryItems:[{amount:`1200`,categoryName:`餐饮`,categoryType:`expense`,parentCategoryName:`饮食`}],id:`00000000-0000-4000-8000-000000009001`,merchant_icon_url:null,merchant_name:`便利店`,note:null,recorder_color:`amber`,recorder_name:`淞文`,transaction_at:`2026-06-05T10:30:00.000Z`,type:`expense`},c={title:`Molecules/Transactions/TransactionRowRecorder`,component:a,decorators:[e=>(0,o.jsx)(n,{sx:{bgcolor:`common.white`,minHeight:`100vh`},children:(0,o.jsx)(e,{})})],args:{item:s,receiptCard:!0,showAccount:!0,showRecorder:!0,showTime:!0}},l={name:`多人账本（成员颜色）`},u={name:`单人账本（隐藏记录人）`,args:{item:{...s,show_recorder:!1}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "多人账本（成员颜色）"
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "单人账本（隐藏记录人）",
  args: {
    item: {
      ...item,
      show_recorder: false
    }
  }
}`,...u.parameters?.docs?.source}}},d=[`MultipleMembers`,`SingleMember`]}))();export{l as MultipleMembers,u as SingleMember,d as __namedExportsOrder,c as default};