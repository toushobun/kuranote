import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./Stack-DRbcmy6F.js";import{n as o,t as s}from"./Typography-CwLqrFKa.js";import{i as c,n as l,r as u,t as d}from"./SortableItem-BpMtGXZC.js";import{n as f,t as p}from"./SortableDragHandle-5FPus-rT.js";var m,h,g,_,v,y;t((()=>{m=r(),a(),s(),h=e(n()),l(),c(),f(),g={title:`Molecules/UI/SortableDragHandle`,component:p,args:{name:`餐饮`,handleProps:{}},render:function(e){let[t,n]=(0,h.useState)([e.name,`日用`]);return(0,m.jsx)(u,{disabled:e.handleProps.disabled,items:t,onReorder:n,children:(0,m.jsx)(i,{spacing:1,sx:{width:280},children:t.map(e=>(0,m.jsx)(d,{id:e,children:t=>(0,m.jsxs)(i,{direction:`row`,sx:{alignItems:`center`,justifyContent:`space-between`,p:1},children:[(0,m.jsx)(o,{children:e}),(0,m.jsx)(p,{name:e,handleProps:t})]})},e))})})}},_={name:`拖拽调整排序`,parameters:{docs:{description:{story:`按住手柄拖动，列表项跟随指针并实时让位，松手后更新顺序。支持鼠标与触屏操作。`}}}},v={name:`禁用拖拽手柄`,args:{handleProps:{disabled:!0}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "拖拽调整排序",
  parameters: {
    docs: {
      description: {
        story: "按住手柄拖动，列表项跟随指针并实时让位，松手后更新顺序。支持鼠标与触屏操作。"
      }
    }
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "禁用拖拽手柄",
  args: {
    handleProps: {
      disabled: true
    }
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`Disabled`]}))();export{_ as Default,v as Disabled,y as __namedExportsOrder,g as default};