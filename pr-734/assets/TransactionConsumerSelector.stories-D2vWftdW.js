import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,o as r,s as i,t as a}from"./TransactionConsumerSelector-Dn_1m7KW.js";import{n as o,t as s}from"./Box-BgJ7m11s.js";var c,l,u,d,f,p,m,h,g,_,v,y;e((()=>{c=t(),s(),i(),n(),l=`00000000-0000-4000-8000-000000000001`,u=`00000000-0000-4000-8000-000000000002`,d=`00000000-0000-4000-8000-000000000003`,f=[{color:`amber`,id:l,name:`淞文`},{color:`sakura`,id:u,name:`秋爽`},{color:`sky`,id:d,name:`宝宝`}],p={title:`Organisms/Transactions/TransactionConsumerSelector`,component:a,decorators:[e=>(0,c.jsx)(o,{sx:{maxWidth:420,p:3},children:(0,c.jsx)(`form`,{children:(0,c.jsx)(e,{})})})]},m={name:`多人账本默认折叠`,decorators:[e=>(0,c.jsx)(r,{value:{consumerOptions:f,recorderUserId:l},children:(0,c.jsx)(e,{})})]},h={name:`记录人即消费者`,decorators:[e=>(0,c.jsx)(r,{value:{consumerOptions:f,initialConsumerUserIds:[l],recorderUserId:l},children:(0,c.jsx)(e,{})})]},g={name:`多个消费者自动展开`,decorators:[e=>(0,c.jsx)(r,{value:{consumerOptions:f,initialConsumerUserIds:[u,d],recorderUserId:l},children:(0,c.jsx)(e,{})})]},_={name:`单人账本隐藏`,decorators:[e=>(0,c.jsx)(r,{value:{consumerOptions:[f[0]],recorderUserId:l},children:(0,c.jsx)(e,{})})]},v={name:`记录人已退出，需要重新选择消费者`,decorators:[e=>(0,c.jsx)(r,{value:{consumerOptions:f.slice(1),initialConsumerUserIds:[l],recorderUserId:l},children:(0,c.jsx)(e,{})})]},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "多人账本默认折叠",
  decorators: [Story => <TransactionConsumerProvider value={{
    consumerOptions,
    recorderUserId: recorderId
  }}>
        <Story />
      </TransactionConsumerProvider>]
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "记录人即消费者",
  decorators: [Story => <TransactionConsumerProvider value={{
    consumerOptions,
    initialConsumerUserIds: [recorderId],
    recorderUserId: recorderId
  }}>
        <Story />
      </TransactionConsumerProvider>]
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "多个消费者自动展开",
  decorators: [Story => <TransactionConsumerProvider value={{
    consumerOptions,
    initialConsumerUserIds: [partnerId, childId],
    recorderUserId: recorderId
  }}>
        <Story />
      </TransactionConsumerProvider>]
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "单人账本隐藏",
  decorators: [Story => <TransactionConsumerProvider value={{
    consumerOptions: [consumerOptions[0]!],
    recorderUserId: recorderId
  }}>
        <Story />
      </TransactionConsumerProvider>]
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "记录人已退出，需要重新选择消费者",
  decorators: [Story => <TransactionConsumerProvider value={{
    consumerOptions: consumerOptions.slice(1),
    initialConsumerUserIds: [recorderId],
    recorderUserId: recorderId
  }}>
        <Story />
      </TransactionConsumerProvider>]
}`,...v.parameters?.docs?.source}}},y=[`MultiMemberLedger`,`RecorderIsConsumer`,`MultipleConsumers`,`SingleMemberHidden`,`InactiveRecorder`]}))();export{v as InactiveRecorder,m as MultiMemberLedger,g as MultipleConsumers,h as RecorderIsConsumer,_ as SingleMemberHidden,y as __namedExportsOrder,p as default};