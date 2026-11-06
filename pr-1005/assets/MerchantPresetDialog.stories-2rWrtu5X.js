import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,t as n}from"./ledger-BGt7TM1w.js";import{n as r,t as i}from"./merchantPresets-BMocj7XG.js";import{n as a,t as o}from"./merchantPresets-CqC6-kPJ.js";import{n as s,t as c}from"./MerchantPresetDialog-D53IhJTO.js";var l,u,d,f,p,m,h,g,_,v;e((()=>{n(),r(),a(),s(),{userEvent:l,within:u}=__STORYBOOK_MODULE_TEST__,d={title:`Organisms/Merchants/MerchantPresetDialog`,component:c,args:{action:async()=>({}),onClose:()=>{},options:o()}},f={},p={args:{options:{...o(),addedKeys:[o().items[0].key]}}},m={args:{options:{region:null,templateVersion:null,groups:[],items:[],addedKeys:[]}}},h={args:{action:()=>new Promise(()=>{})},play:async({canvasElement:e})=>{let t=u(e.ownerDocument.body);await l.click(t.getByRole(`checkbox`,{name:`选择「超市」的全部商家`})),await l.click(t.getByRole(`button`,{name:`添加 3 个商家`}))}},g=t(`jp`),_={name:`旧账本`,args:{options:{...i(g),region:null,addedKeys:[`don_quijote`,`matsumoto_kiyoshi`],templateVersion:g.version}},play:async({canvasElement:e})=>{let t=u(e.ownerDocument.body);await l.click(t.getByRole(`button`,{name:`购物`})),await l.click(t.getByRole(`checkbox`,{name:/^苹果/}))}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    options: {
      ...createMerchantPresetOptions(),
      addedKeys: [createMerchantPresetOptions().items[0]!.key]
    }
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    options: {
      region: null,
      templateVersion: null,
      groups: [],
      items: [],
      addedKeys: []
    }
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    action: () => new Promise<MerchantActionState>(() => {})
  },
  play: async ({
    canvasElement
  }) => {
    const dialog = within(canvasElement.ownerDocument.body);
    await userEvent.click(dialog.getByRole("checkbox", {
      name: "选择「超市」的全部商家"
    }));
    await userEvent.click(dialog.getByRole("button", {
      name: "添加 3 个商家"
    }));
  }
}`,...h.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "旧账本",
  args: {
    options: {
      ...buildMerchantChecklist(template),
      region: null,
      addedKeys: ["don_quijote", "matsumoto_kiyoshi"],
      templateVersion: template.version
    }
  },
  play: async ({
    canvasElement
  }) => {
    const dialog = within(canvasElement.ownerDocument.body);
    await userEvent.click(dialog.getByRole("button", {
      name: "购物"
    }));
    await userEvent.click(dialog.getByRole("checkbox", {
      name: /^苹果/
    }));
  }
}`,..._.parameters?.docs?.source}}},v=[`Default`,`AlreadyAdded`,`NoTemplate`,`Submitting`,`LegacyLedger`]}))();export{p as AlreadyAdded,f as Default,_ as LegacyLedger,m as NoTemplate,h as Submitting,v as __namedExportsOrder,d as default};