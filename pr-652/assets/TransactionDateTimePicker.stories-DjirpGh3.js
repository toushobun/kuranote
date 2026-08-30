import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./TransactionDateTimePicker-CydTJnzq.js";async function o(e){let t=d(e);await u.click(await t.findByRole(`button`,{name:`选择记账时间`}))}var s,c,l,u,d,f,p,m,h,g,_,v,y,b,x;t((()=>{s=r(),c=e(n()),a(),{screen:l,userEvent:u,within:d}=__STORYBOOK_MODULE_TEST__,f={title:`Molecules/Transactions/TransactionDateTimePicker`,component:i,render:function(e){let[t,n]=(0,c.useState)(e.date),[r,a]=(0,c.useState)(e.time);return(0,s.jsx)(i,{...e,date:t,onDateChange:n,onTimeChange:a,time:r})},args:{date:`2026-06-20`,onDateChange:()=>void 0,onTimeChange:()=>void 0,time:`13:10:33`}},p={name:`默认当前时间`},m={name:`自定义日期时间`,args:{date:`2025-12-31`,time:`18:45:00`}},h={name:`打开日期选择器`,play:async({canvasElement:e})=>{await o(e)}},g={name:`打开时刻选择器`,play:async({canvasElement:e})=>{await o(e),await u.click(await l.findByRole(`button`,{name:`选择时刻`}))}},_={name:`打开年月选择器`,play:async({canvasElement:e})=>{await o(e),await u.click(await l.findByRole(`button`,{name:`手动选择年月`}))}},v={name:`边界时间 00:00:00`,args:{date:`2026-01-01`,time:`00:00:00`}},y={name:`边界时间 23:59:59`,args:{date:`2026-12-31`,time:`23:59:59`}},b={name:`异常值 fallback`,args:{date:`invalid-date`,time:`invalid-time`}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "默认当前时间"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "自定义日期时间",
  args: {
    date: "2025-12-31",
    time: "18:45:00"
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "打开日期选择器",
  play: async ({
    canvasElement
  }) => {
    await openPicker(canvasElement);
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "打开时刻选择器",
  play: async ({
    canvasElement
  }) => {
    await openPicker(canvasElement);
    await userEvent.click(await screen.findByRole("button", {
      name: "选择时刻"
    }));
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "打开年月选择器",
  play: async ({
    canvasElement
  }) => {
    await openPicker(canvasElement);
    await userEvent.click(await screen.findByRole("button", {
      name: "手动选择年月"
    }));
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "边界时间 00:00:00",
  args: {
    date: "2026-01-01",
    time: "00:00:00"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "边界时间 23:59:59",
  args: {
    date: "2026-12-31",
    time: "23:59:59"
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "异常值 fallback",
  args: {
    date: "invalid-date",
    time: "invalid-time"
  }
}`,...b.parameters?.docs?.source}}},x=[`Default`,`CustomDateTime`,`DatePickerOpen`,`TimePickerOpen`,`MonthPickerOpen`,`Midnight`,`EndOfDay`,`FallbackValue`]}))();export{m as CustomDateTime,h as DatePickerOpen,p as Default,y as EndOfDay,b as FallbackValue,v as Midnight,_ as MonthPickerOpen,g as TimePickerOpen,x as __namedExportsOrder,f as default};