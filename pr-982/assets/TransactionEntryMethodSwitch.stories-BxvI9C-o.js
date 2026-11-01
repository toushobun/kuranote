import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionEntryMethodSwitch-DyQ-najh.js";var r,i,a,o,s,c;e((()=>{t(),{userEvent:r,within:i}=__STORYBOOK_MODULE_TEST__,a={title:`Organisms/Transactions/TransactionEntryMethodSwitch`,component:n,args:{currentMethod:`transfer`}},o={name:`切换方式按钮`},s={name:`打开方式选择（当前为账户周转）`,play:async({canvasElement:e})=>{await r.click(i(e).getByRole(`button`,{name:`切换方式`}))}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "切换方式按钮"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "打开方式选择（当前为账户周转）",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "切换方式"
    }));
  }
}`,...s.parameters?.docs?.source}}},c=[`Default`,`Opened`]}))();export{o as Default,s as Opened,c as __namedExportsOrder,a as default};