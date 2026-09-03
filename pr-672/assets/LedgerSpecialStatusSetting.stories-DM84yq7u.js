import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./LedgerSpecialStatusSetting-3bYEtdpA.js";function o(){let[e,t]=(0,c.useState)(!0);return(0,s.jsx)(a,{enabled:e,onChange:t})}var s,c,l,u,d,f,p,m,h,g,_;t((()=>{s=r(),c=e(n()),i(),{expect:l,within:u}=__STORYBOOK_MODULE_TEST__,d={title:`Organisms/Ledgers/LedgerSpecialStatusSetting`,component:a,args:{enabled:!0,onChange:()=>void 0}},f={name:`可交互启停`,render:()=>(0,s.jsx)(o,{})},p={name:`关闭规则提示`,args:{enabled:!1},play:async({canvasElement:e})=>{await l(u(e).getByText(`如果账本内还有待报销或已报销的明细，将无法关闭；请先处理完这些明细。`)).toBeInTheDocument()}},m={name:`普通成员只读`,args:{canEdit:!1}},h={name:`加载状态`,args:{state:`loading`}},g={name:`错误状态`,args:{onRetry:()=>void 0,state:`error`}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "可交互启停",
  render: () => <InteractivePreview />
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "关闭规则提示",
  args: {
    enabled: false
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("如果账本内还有待报销或已报销的明细，将无法关闭；请先处理完这些明细。")).toBeInTheDocument();
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "普通成员只读",
  args: {
    canEdit: false
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "加载状态",
  args: {
    state: "loading"
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "错误状态",
  args: {
    onRetry: () => undefined,
    state: "error"
  }
}`,...g.parameters?.docs?.source}}},_=[`Interactive`,`Disabled`,`MemberReadonly`,`Loading`,`Error`]}))();export{p as Disabled,g as Error,f as Interactive,h as Loading,m as MemberReadonly,_ as __namedExportsOrder,d as default};