import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-2b9_HSgc.js";import{n as i,t as a}from"./TransactionRow-CxArL65j.js";var o,s,c,l,u,d,f;e((()=>{o=t(),r(),i(),s={account_color:`sakura`,account_currency:`JPY`,account_name:`日元现金`,amount:`1200`,categoryItems:[{amount:`1200`,categoryName:`餐饮`,categoryType:`expense`,parentCategoryName:`饮食`}],consumers:[{color:`amber`,id:`member-1`,name:`淞文`},{color:`sakura`,id:`member-2`,name:`秋爽`},{color:`sky`,id:`member-3`,name:`宝宝`}],id:`00000000-0000-4000-8000-000000009001`,merchant_icon_url:null,merchant_name:`便利店`,note:null,transaction_at:`2026-09-08T10:30:00.000Z`,type:`expense`},c={title:`Molecules/Transactions/TransactionRowConsumer`,component:a,decorators:[e=>(0,o.jsx)(n,{sx:{bgcolor:`common.white`,minHeight:`100vh`},children:(0,o.jsx)(e,{})})],args:{item:s,receiptCard:!0,showAccount:!0,showRecorder:!0,showTime:!0}},l={name:`多人消费者（最多 2 人 + N）`},u={name:`单个消费者`,args:{item:{...s,consumers:[s.consumers[0]]}}},d={name:`单人账本（隐藏消费者）`,args:{item:{...s,show_recorder:!1}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "多人消费者（最多 2 人 + N）"
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "单个消费者",
  args: {
    item: {
      ...item,
      consumers: [item.consumers![0]!]
    }
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "单人账本（隐藏消费者）",
  args: {
    item: {
      ...item,
      show_recorder: false
    }
  }
}`,...d.parameters?.docs?.source}}},f=[`MultipleConsumers`,`SingleConsumer`,`SingleMemberLedger`]}))();export{l as MultipleConsumers,u as SingleConsumer,d as SingleMemberLedger,f as __namedExportsOrder,c as default};