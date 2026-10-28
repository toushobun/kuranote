import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{r as i,t as a}from"./ledgerMessages-Dd5VC2Kw.js";import{n as o,t as s}from"./LedgerMultiAccountPaymentSetting-CgjWHkHD.js";function c(){let[e,t]=(0,u.useState)(!1);return(0,l.jsx)(s,{enabled:e,onChange:t})}var l,u,d,f,p,m,h,g,_,v,y;t((()=>{l=r(),u=e(n()),a(),o(),{expect:d,within:f}=__STORYBOOK_MODULE_TEST__,p={title:`Organisms/Ledgers/LedgerMultiAccountPaymentSetting`,component:s,args:{enabled:!0,onChange:()=>void 0}},m={name:`可交互启停`,render:()=>(0,l.jsx)(c,{})},h={name:`开启（关闭限制说明）`,play:async({canvasElement:e})=>{await d(f(e).getByText(i.multiAccountPayment.enabledDescription)).toBeInTheDocument()}},g={name:`关闭`,args:{enabled:!1}},_={name:`不显示关闭限制说明（创建账本向导）`,args:{enabledDescription:null}},v={name:`普通成员只读`,args:{canEdit:!1}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "可交互启停",
  render: () => <InteractivePreview />
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "开启（关闭限制说明）",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(ledgerFeatureSettingMessages.multiAccountPayment.enabledDescription)).toBeInTheDocument();
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "关闭",
  args: {
    enabled: false
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "不显示关闭限制说明（创建账本向导）",
  args: {
    enabledDescription: null
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "普通成员只读",
  args: {
    canEdit: false
  }
}`,...v.parameters?.docs?.source}}},y=[`Interactive`,`Enabled`,`Disabled`,`WithoutEnabledDescription`,`MemberReadonly`]}))();export{g as Disabled,h as Enabled,m as Interactive,v as MemberReadonly,_ as WithoutEnabledDescription,y as __namedExportsOrder,p as default};