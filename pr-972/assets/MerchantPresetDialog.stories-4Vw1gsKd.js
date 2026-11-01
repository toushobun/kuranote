import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./merchantPresets-CfWZbo9E.js";import{n as r,t as i}from"./MerchantPresetDialog-6G9DaWB-.js";var a,o,s,c,l,u,d,f;e((()=>{t(),r(),{userEvent:a,within:o}=__STORYBOOK_MODULE_TEST__,s={title:`Organisms/Merchants/MerchantPresetDialog`,component:i,args:{action:async()=>({}),onClose:()=>{},options:n()}},c={},l={args:{options:{...n(),addedKeys:[n().items[0].key]}}},u={args:{options:{currency:`USD`,templateVersion:null,groups:[],items:[],addedKeys:[]}}},d={args:{action:()=>new Promise(()=>{})},play:async({canvasElement:e})=>{let t=o(e.ownerDocument.body);await a.click(t.getByRole(`button`,{name:`全部选择`})),await a.click(t.getByRole(`button`,{name:`添加 3 个商家`}))}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    options: {
      ...createMerchantPresetOptions(),
      addedKeys: [createMerchantPresetOptions().items[0]!.key]
    }
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    options: {
      currency: "USD",
      templateVersion: null,
      groups: [],
      items: [],
      addedKeys: []
    }
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    action: () => new Promise<MerchantActionState>(() => {})
  },
  play: async ({
    canvasElement
  }) => {
    const dialog = within(canvasElement.ownerDocument.body);
    await userEvent.click(dialog.getByRole("button", {
      name: "全部选择"
    }));
    await userEvent.click(dialog.getByRole("button", {
      name: "添加 3 个商家"
    }));
  }
}`,...d.parameters?.docs?.source}}},f=[`Default`,`AlreadyAdded`,`NoTemplate`,`Submitting`]}))();export{l as AlreadyAdded,c as Default,u as NoTemplate,d as Submitting,f as __namedExportsOrder,s as default};