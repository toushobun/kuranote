import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./StepProgress-CP9twzqi.js";var i,a,o,s,c,l,u,d,f;e((()=>{i=t(),n(),a={title:`Molecules/UI/StepProgress`,component:r,decorators:[e=>(0,i.jsx)(`div`,{style:{maxWidth:420},children:(0,i.jsx)(e,{})})],args:{currentStep:1,label:`创建进度`,steps:[`基本信息`,`账户`,`商家`,`功能`,`确认`,`邀请`]}},o={name:`第 1 步`},s={name:`第 3 步（前两步已完成）`,args:{currentStep:3}},c={name:`最后一步`,args:{currentStep:6}},l={name:`返回修改时保留其他完成状态`,args:{steps:[`商家`,`账户`,`明细`,`确认`],currentStep:2,completedSteps:[1,2,3],clickableSteps:[1,2,3,4],onStepClick:()=>{}}},u={name:`步骤名下方显示选择内容`,args:{steps:[`商家`,`账户`,`明细`,`确认`],stepDetails:[`7-Eleven`,`三井住友卡 等 2 个账户`],currentStep:3,completedSteps:[1,2],clickableSteps:[1,2,3,4],onStepClick:()=>{}}},d={name:`选择内容过长时省略`,args:{...u.args,stepDetails:[`Amazon マーケットプレイス 日本`,`三井住友カード ゴールド`]}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "第 1 步"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "第 3 步（前两步已完成）",
  args: {
    currentStep: 3
  }
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "最后一步",
  args: {
    currentStep: 6
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "返回修改时保留其他完成状态",
  args: {
    steps: ["商家", "账户", "明细", "确认"],
    currentStep: 2,
    completedSteps: [1, 2, 3],
    clickableSteps: [1, 2, 3, 4],
    onStepClick: () => {}
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "步骤名下方显示选择内容",
  args: {
    steps: ["商家", "账户", "明细", "确认"],
    stepDetails: ["7-Eleven", "三井住友卡 等 2 个账户"],
    currentStep: 3,
    completedSteps: [1, 2],
    clickableSteps: [1, 2, 3, 4],
    onStepClick: () => {}
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "选择内容过长时省略",
  args: {
    ...WithStepDetails.args,
    stepDetails: ["Amazon マーケットプレイス 日本", "三井住友カード ゴールド"]
  }
}`,...d.parameters?.docs?.source}}},f=[`FirstStep`,`MiddleStep`,`LastStep`,`EditableCompletedSteps`,`WithStepDetails`,`LongStepDetails`]}))();export{l as EditableCompletedSteps,o as FirstStep,c as LastStep,d as LongStepDetails,s as MiddleStep,u as WithStepDetails,f as __namedExportsOrder,a as default};