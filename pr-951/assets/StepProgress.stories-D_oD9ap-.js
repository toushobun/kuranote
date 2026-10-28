import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./StepProgress-bsKDSPlJ.js";var i,a,o,s,c,l,u;e((()=>{i=t(),n(),a={title:`Molecules/UI/StepProgress`,component:r,decorators:[e=>(0,i.jsx)(`div`,{style:{maxWidth:420},children:(0,i.jsx)(e,{})})],args:{currentStep:1,label:`创建进度`,steps:[`基本信息`,`账户`,`商家`,`功能`,`确认`,`邀请`]}},o={name:`第 1 步`},s={name:`第 3 步（前两步已完成）`,args:{currentStep:3}},c={name:`最后一步`,args:{currentStep:6}},l={name:`返回修改时保留其他完成状态`,args:{steps:[`商家`,`账户`,`明细`,`确认`],currentStep:2,completedSteps:[1,2,3],clickableSteps:[1,2,3,4],onStepClick:()=>{}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...l.parameters?.docs?.source}}},u=[`FirstStep`,`MiddleStep`,`LastStep`,`EditableCompletedSteps`]}))();export{l as EditableCompletedSteps,o as FirstStep,c as LastStep,s as MiddleStep,u as __namedExportsOrder,a as default};