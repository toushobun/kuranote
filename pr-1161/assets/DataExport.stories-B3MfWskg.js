const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./dataExportWorkbook-B6lz5VnH.js","./preload-helper-D2yxXLVK.js","./dataImport-zFCxUaGo.js","./transaction-v5q89a69.js","./transactionAttachmentLimits-CU9akmh1.js","./sharedErrorMessages-1yTvmKpx.js","./transactionAmountInput-DQ1Yq6ll.js","./dataImportExportMessages-D1GI4b03.js","./account-kTnxwOL5.js","./errors-CnHTd7cw.js","./ledger-vCOwyEdk.js","./formValidation-CKylcdjK.js","./themeColorTokens-CToUvU_n.js","./dataExport-DqIFsfq9.js","./appError-CzDbWkbV.js","./accounts-Dk2QA-HD.js","./accounts-Sd-G5BwS.js","./ledgers-D3P1mq-2.js","./categoryNames-BSS7MKSq.js","./categoryEmojis-97W7iB8O.js","./transactions-CE_ZLU3B.js","./dateTime-D4bH2MPn.js"])))=>i.map(i=>d[i]);
import{c as e,i as t,n,t as r}from"./preload-helper-D2yxXLVK.js";import{t as i}from"./react-DAMDAfNa.js";import{t as a}from"./jsx-runtime-Dwpk6tgA.js";import{n as o,t as s}from"./ButtonBase-CkOSOleJ.js";import{n as c,t as l}from"./Typography-B_0Lz4TE.js";import{n as u,t as d}from"./TextField-CqbJD86D.js";import{n as f,t as p}from"./FormControlLabel-B5h8Q2U5.js";import{o as m,r as h}from"./paths-Cn5DhC5u.js";import{G as g,W as _,d as v,m as y}from"./iframe-6HLxDhzm.js";import{n as b,t as x}from"./Chip-DQLaG1Ae.js";import{n as S,t as C}from"./Stack-CedAN9w3.js";import{n as w,t as ee}from"./ChevronRightRounded-Ci9Y-4eN.js";import{n as T,t as te}from"./actionPendingMessages-B03PK8BF.js";import{n as E,t as ne}from"./ActionButton-CHbceAJf.js";import{n as D,t as O}from"./SectionCard-T6-xvFNz.js";import{n as re,t as ie}from"./SettingsPageLayout-CWGJqYLp.js";import{n as ae,t as k}from"./CheckCircleRounded-BC_1VSlS.js";import{n as oe,t as se}from"./Switch-DKnl9CEi.js";import{d as ce,f as A,t as j}from"./dataImportExportMessages-D1GI4b03.js";import{n as M,t as le}from"./RadioButtonUncheckedRounded-CzlJ5fqH.js";import{i as N,n as ue,r as de,t as P}from"./dataExport-DqIFsfq9.js";function F(){let e={transactionAt:`2026-09-19T01:02:03.000Z`,recorderName:`历史记账人`,note:`=原样备注`,merchantId:`shop`};return{accounts:[{id:`cash`,name:`现金`,currency:`JPY`,type:`cash`,holder:{name:`小明`,displayColor:`sky`}},{id:`bank`,name:`存款`,currency:`JPY`,type:`bank`,holder:{name:`小红`,displayColor:`rose`}},{id:`none`,name:`公共账户`,currency:`CNY`,type:`other`,holder:null}],categories:[{id:`food`,name:`🍚 饮食`,parent_id:null,type:`expense`},{id:`lunch`,name:`午餐`,parent_id:`food`,type:`expense`},{id:`salary`,name:`工资`,parent_id:null,type:`income`}],merchants:[{id:`shop`,name:`商家展示名`,tagNames:[`餐饮`,`附近`]}],records:[{...e,id:`normal`,type:`normal`,items:[{categoryId:`lunch`,amount:`123.45`},{categoryId:`food`,amount:`50`},{categoryId:`salary`,amount:`10`}],payments:[{accountId:`cash`,amount:`163.45`}]},{...e,id:`transfer`,type:`transfer`,merchantId:null,items:[{accountId:`bank`,categoryId:null,amount:`300`,balanceDelta:`300`},{accountId:`cash`,categoryId:null,amount:`300`,balanceDelta:`-300`}]},{...e,id:`adjustment`,type:`balance_adjustment`,merchantId:null,items:[{accountId:`none`,categoryId:null,amount:`12.34`,balanceDelta:`-12.34`}]}]}}function fe(){return{accounts:[],categories:[],merchants:[],records:[]}}var pe=t((()=>{}));function I(e,t=new Date){let n=e=>String(e).padStart(2,`0`),r=`${t.getFullYear()}${n(t.getMonth()+1)}${n(t.getDate())}`,i=`${n(t.getHours())}${n(t.getMinutes())}${n(t.getSeconds())}`;return`KuraNote-${e.replace(/[<>:"/\\|?*\u0000-\u001f]/g,`_`).replace(/[. ]+$/g,``)||j.fallbackLedgerName}-${r}-${i}.xlsx`}var me=t((()=>{A()}));function he(e){let t=(0,L.useRef)(!1),[n,i]=(0,L.useState)(!1),[a,o]=(0,L.useState)(null),[s,c]=(0,L.useState)(null),[l,u]=(0,L.useState)(``),[d,f]=(0,L.useState)(``),[p,m]=(0,L.useState)([`normal`,`transfer`,`balance_adjustment`]),h=!!(l&&d&&l>d),g=p.length>0&&!h;function _(e){m(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e])}let[v,y]=(0,L.useState)(!1),[b,x]=(0,L.useState)(null);async function S(){if(!(t.current||!g)){t.current=!0,i(!0),o(null),c(null),x(null);try{let t=l?new Date(`${l}T00:00:00`):null,n=d?new Date(`${d}T00:00:00`):null;n&&n.setDate(n.getDate()+1);let i=await e({includePhotos:v,recordTypes:p,...t?{dateStart:t.toISOString()}:{},...n?{dateEnd:n.toISOString()}:{}});if(!i.data){o(i.error??N.exportFailed);return}let{buildDataExportWorkbook:a}=await r(async()=>{let{buildDataExportWorkbook:e}=await import(`./dataExportWorkbook-B6lz5VnH.js`);return{buildDataExportWorkbook:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]),import.meta.url),s=v?await a(i.data,{onPhotoProgress:(e,t)=>{t>0&&x({done:e,total:t})}}):await a(i.data),u=new Blob([s],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),f=URL.createObjectURL(u),m=document.createElement(`a`);try{m.href=f;let e=I(i.ledgerName);m.download=e,document.body.appendChild(m),m.click(),c(e)}finally{m.remove(),setTimeout(()=>URL.revokeObjectURL(f),1e3)}}catch(e){o(e instanceof de||e instanceof ue?e.message:N.downloadFailed)}finally{t.current=!1,i(!1),x(null)}}}return{includePhotos:v,setIncludePhotos:y,photoProgress:b,isExporting:n,error:a,downloadedFile:s,startDate:l,setStartDate:u,endDate:d,setEndDate:f,recordTypes:p,toggleRecordType:_,canExport:g,invalidDateRange:h,handleExport:S,closeError:()=>o(null)}}var L,ge=t((()=>{L=e(i()),me(),P(),n()}));function R({exportAction:e}){let[t,n]=(0,B.useState)(!1),{includePhotos:r,setIncludePhotos:i,photoProgress:a,isExporting:s,error:l,downloadedFile:d,startDate:p,setStartDate:h,endDate:_,setEndDate:y,recordTypes:x,toggleRecordType:C,canExport:w,invalidDateRange:T,handleExport:E,closeError:D}=he(e);return(0,z.jsxs)(ie,{back:{href:m.settingsData,label:ce.backToEntry},title:j.title,subtitle:j.subtitle,children:[(0,z.jsxs)(S,{spacing:2.5,children:[(0,z.jsx)(O,{children:(0,z.jsxs)(S,{spacing:1.5,children:[(0,z.jsx)(c,{sx:{fontWeight:700},children:j.scopeTitle}),(0,z.jsxs)(o,{"aria-expanded":t,disabled:s,onClick:()=>n(e=>!e),sx:{justifyContent:`space-between`,width:`100%`,borderRadius:1,py:1,textAlign:`left`,gap:1},children:[(0,z.jsx)(c,{variant:`body2`,sx:{flexShrink:0},children:j.dateRange}),(0,z.jsxs)(S,{direction:`row`,spacing:.5,sx:{alignItems:`center`,color:`text.secondary`},children:[(0,z.jsx)(c,{variant:`body2`,sx:{textAlign:`right`},children:j.dateSummary(p,_)}),(0,z.jsx)(ee,{fontSize:`small`})]})]}),t?(0,z.jsxs)(S,{direction:`row`,spacing:1,children:[(0,z.jsx)(u,{fullWidth:!0,size:`small`,type:`date`,label:j.startDate,value:p,onChange:e=>h(e.target.value),disabled:s,slotProps:{inputLabel:{shrink:!0}}}),(0,z.jsx)(u,{fullWidth:!0,size:`small`,type:`date`,label:j.endDate,value:_,error:T,helperText:T?j.invalidDateRange:void 0,onChange:e=>y(e.target.value),disabled:s,slotProps:{inputLabel:{shrink:!0}}})]}):T?(0,z.jsx)(c,{variant:`caption`,color:`error`,children:j.invalidDateRange}):null,(0,z.jsx)(c,{variant:`body2`,children:j.recordTypesTitle}),(0,z.jsx)(S,{direction:`row`,useFlexGap:!0,spacing:.5,sx:{flexWrap:`wrap`},children:[`normal`,`transfer`,`balance_adjustment`].map(e=>{let t=x.includes(e);return(0,z.jsx)(b,{role:`checkbox`,"aria-checked":t,label:j.recordTypes[e],icon:t?(0,z.jsx)(k,{}):(0,z.jsx)(le,{}),color:t?`primary`:`default`,variant:t?`filled`:`outlined`,disabled:s,onClick:()=>C(e)},e)})}),(0,z.jsx)(c,{color:`textSecondary`,variant:`body2`,children:j.scope})]})}),(0,z.jsx)(O,{children:(0,z.jsxs)(S,{spacing:1,children:[(0,z.jsx)(f,{labelPlacement:`start`,sx:{justifyContent:`space-between`,mx:0},control:(0,z.jsx)(oe,{checked:r,disabled:s,onChange:(e,t)=>i(t)}),label:j.includePhotos}),r?(0,z.jsx)(c,{color:`textSecondary`,variant:`body2`,children:j.photoSizeHint}):null]})}),(0,z.jsx)(ne,{pending:s,pendingLabel:te.export,disabled:!w,onClick:E,variant:`contained`,fullWidth:!0,children:j.button}),a?(0,z.jsx)(c,{role:`status`,color:`textSecondary`,variant:`body2`,children:j.photoProgress(a.done,a.total)}):null,d?(0,z.jsx)(g,{severity:`success`,children:j.success(d)}):null]}),(0,z.jsx)(v,{open:l!==null,onClose:D,title:j.failureTitle,description:l})]})}var z,B,_e=t((()=>{z=a(),ae(),w(),M(),s(),x(),d(),_(),p(),se(),C(),l(),E(),T(),A(),h(),y(),D(),re(),B=e(i()),ge(),R.__docgenInfo={description:``,methods:[],displayName:`DataExportTemplate`,props:{exportAction:{required:!0,tsType:{name:`DataExportAction`},description:``}}}})),V,H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{P(),pe(),_e(),{userEvent:V,within:H}=__STORYBOOK_MODULE_TEST__,U=async()=>({data:F(),ledgerName:`家庭账本`}),W={title:`Templates/Settings/DataExportTemplate`,component:R,args:{exportAction:U}},G=async({canvasElement:e})=>{await V.click(H(e).getByRole(`button`,{name:`导出 Excel`}))},K={name:`默认（可下载示例）`},q={name:`导出照片开关`,play:async({canvasElement:e})=>{await V.click(H(e).getByRole(`switch`,{name:`导出照片`}))}},J={name:`正在准备照片`,args:{exportAction:async()=>({ledgerName:`家庭账本`,data:{...F(),photos:[{recordId:`normal`,sortOrder:0,fullUrl:`https://example.com/photo.jpg`}]}})},play:async({canvasElement:e})=>{let t=globalThis.fetch;globalThis.fetch=()=>new Promise(()=>{});try{let t=H(e);await V.click(t.getByRole(`switch`,{name:`导出照片`})),await V.click(t.getByRole(`button`,{name:`导出 Excel`})),await t.findByText(`正在准备照片 0/1`)}finally{globalThis.fetch=t}}},Y={name:`导出中`,args:{exportAction:()=>new Promise(()=>{})},play:G},X={name:`导出失败`,args:{exportAction:async()=>({error:N.exportFailed})},play:G},Z={name:`空账本（可下载表头）`,args:{exportAction:async()=>({data:fe(),ledgerName:`家庭账本`})}},Q={name:`已选日期及记录类型`,play:async({canvasElement:e})=>{let t=H(e);await V.click(t.getByRole(`button`,{name:/日期区间/})),await V.click(t.getByRole(`checkbox`,{name:`转账`}))}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "默认（可下载示例）"
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "导出照片开关",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("switch", {
      name: "导出照片"
    }));
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "正在准备照片",
  args: {
    exportAction: async () => ({
      ledgerName: "家庭账本",
      data: {
        ...createDataExportFixture(),
        photos: [{
          recordId: "normal",
          sortOrder: 0,
          fullUrl: "https://example.com/photo.jpg"
        }]
      }
    })
  },
  play: async ({
    canvasElement
  }) => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => new Promise<Response>(() => {});
    try {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole("switch", {
        name: "导出照片"
      }));
      await userEvent.click(canvas.getByRole("button", {
        name: "导出 Excel"
      }));
      await canvas.findByText("正在准备照片 0/1");
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "导出中",
  args: {
    exportAction: () => new Promise(() => {})
  },
  play: startExport
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "导出失败",
  args: {
    exportAction: async () => ({
      error: dataExportErrorMessages.exportFailed
    })
  },
  play: startExport
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "空账本（可下载表头）",
  args: {
    exportAction: async () => ({
      data: createEmptyDataExport(),
      ledgerName: "家庭账本"
    })
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "已选日期及记录类型",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: /日期区间/
    }));
    await userEvent.click(canvas.getByRole("checkbox", {
      name: "转账"
    }));
  }
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`IncludePhotos`,`DownloadingPhotos`,`Exporting`,`Failed`,`Empty`,`SelectedRange`]}))();export{K as Default,J as DownloadingPhotos,Z as Empty,Y as Exporting,X as Failed,q as IncludePhotos,Q as SelectedRange,$ as __namedExportsOrder,W as default};