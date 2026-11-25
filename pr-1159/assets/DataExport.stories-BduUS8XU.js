const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./dataExportWorkbook-fic2Osl2.js","./preload-helper-D2yxXLVK.js","./dataImport-CCHmMGTO.js","./transaction-v5q89a69.js","./transactionAttachmentLimits-CU9akmh1.js","./sharedErrorMessages-1yTvmKpx.js","./transactionAmountInput-DQ1Yq6ll.js","./dataImportExportMessages-yp9stF3W.js","./account-kTnxwOL5.js","./errors-CnHTd7cw.js","./ledger-vCOwyEdk.js","./formValidation-CKylcdjK.js","./themeColorTokens-CToUvU_n.js","./dataExport-DqIFsfq9.js","./appError-CzDbWkbV.js","./accounts-Dk2QA-HD.js","./accounts-Sd-G5BwS.js","./ledgers-D3P1mq-2.js","./categoryNames-BSS7MKSq.js","./categoryEmojis-97W7iB8O.js","./transactions-CE_ZLU3B.js","./dateTime-D4bH2MPn.js"])))=>i.map(i=>d[i]);
import{c as e,i as t,n,t as r}from"./preload-helper-D2yxXLVK.js";import{t as i}from"./react-DAMDAfNa.js";import{t as a}from"./jsx-runtime-Dwpk6tgA.js";import{n as o,t as s}from"./Typography-B_0Lz4TE.js";import{n as c,t as l}from"./Checkbox-CClmPHtI.js";import{n as u,t as d}from"./TextField-CZfP3ema.js";import{n as f,t as p}from"./FormControlLabel-B5h8Q2U5.js";import{o as m,r as h}from"./paths-Cn5DhC5u.js";import{G as g,W as _,d as v,m as y}from"./iframe-BqxEZhMT.js";import{n as b,t as x}from"./Stack-CedAN9w3.js";import{n as S,t as ee}from"./actionPendingMessages-B03PK8BF.js";import{n as C,t as w}from"./ActionButton-CuHsRbxS.js";import{n as T,t as E}from"./SectionCard-D0qQh6-o.js";import{n as te,t as D}from"./SettingsPageLayout-chF279uO.js";import{n as O,t as k}from"./Switch-DKnl9CEi.js";import{d as A,f as j,t as M}from"./dataImportExportMessages-yp9stF3W.js";import{i as N,n as P,r as ne,t as F}from"./dataExport-DqIFsfq9.js";function I(){let e={transactionAt:`2026-09-19T01:02:03.000Z`,recorderName:`历史记账人`,note:`=原样备注`,merchantId:`shop`};return{accounts:[{id:`cash`,name:`现金`,currency:`JPY`,type:`cash`,holder:{name:`小明`,displayColor:`sky`}},{id:`bank`,name:`存款`,currency:`JPY`,type:`bank`,holder:{name:`小红`,displayColor:`rose`}},{id:`none`,name:`公共账户`,currency:`CNY`,type:`other`,holder:null}],categories:[{id:`food`,name:`🍚 饮食`,parent_id:null,type:`expense`},{id:`lunch`,name:`午餐`,parent_id:`food`,type:`expense`},{id:`salary`,name:`工资`,parent_id:null,type:`income`}],merchants:[{id:`shop`,name:`商家展示名`,tagNames:[`餐饮`,`附近`]}],records:[{...e,id:`normal`,type:`normal`,items:[{categoryId:`lunch`,amount:`123.45`},{categoryId:`food`,amount:`50`},{categoryId:`salary`,amount:`10`}],payments:[{accountId:`cash`,amount:`163.45`}]},{...e,id:`transfer`,type:`transfer`,merchantId:null,items:[{accountId:`bank`,categoryId:null,amount:`300`,balanceDelta:`300`},{accountId:`cash`,categoryId:null,amount:`300`,balanceDelta:`-300`}]},{...e,id:`adjustment`,type:`balance_adjustment`,merchantId:null,items:[{accountId:`none`,categoryId:null,amount:`12.34`,balanceDelta:`-12.34`}]}]}}function re(){return{accounts:[],categories:[],merchants:[],records:[]}}var ie=t((()=>{}));function ae(e,t=new Date){let n=e=>String(e).padStart(2,`0`),r=`${t.getFullYear()}${n(t.getMonth()+1)}${n(t.getDate())}`,i=`${n(t.getHours())}${n(t.getMinutes())}${n(t.getSeconds())}`;return`KuraNote-${e.replace(/[<>:"/\\|?*\u0000-\u001f]/g,`_`).replace(/[. ]+$/g,``)||`账本`}-${r}-${i}.xlsx`}var oe=t((()=>{}));function se(e){let t=(0,L.useRef)(!1),[n,i]=(0,L.useState)(!1),[a,o]=(0,L.useState)(null),[s,c]=(0,L.useState)(null),[l,u]=(0,L.useState)(``),[d,f]=(0,L.useState)(``),[p,m]=(0,L.useState)([`normal`,`transfer`,`balance_adjustment`]),h=p.length>0&&(!l||!d||l<=d);function g(e){m(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e])}let[_,v]=(0,L.useState)(!1),[y,b]=(0,L.useState)(null);async function x(){if(!(t.current||!h)){t.current=!0,i(!0),o(null),c(null),b(null);try{let t=l?new Date(`${l}T00:00:00`):null,n=d?new Date(`${d}T00:00:00`):null;n&&n.setDate(n.getDate()+1);let i=await e({includePhotos:_,recordTypes:p,...t?{dateStart:t.toISOString()}:{},...n?{dateEnd:n.toISOString()}:{}});if(!i.data){o(i.error??N.exportFailed);return}let{buildDataExportWorkbook:a}=await r(async()=>{let{buildDataExportWorkbook:e}=await import(`./dataExportWorkbook-fic2Osl2.js`);return{buildDataExportWorkbook:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]),import.meta.url),s=_?await a(i.data,{onPhotoProgress:(e,t)=>{t>0&&b({done:e,total:t})}}):await a(i.data),u=new Blob([s],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),f=URL.createObjectURL(u),m=document.createElement(`a`);try{m.href=f;let e=ae(i.ledgerName??`账本`);m.download=e,document.body.appendChild(m),m.click(),c(e)}finally{m.remove(),setTimeout(()=>URL.revokeObjectURL(f),1e3)}}catch(e){o(e instanceof ne||e instanceof P?e.message:N.downloadFailed)}finally{t.current=!1,i(!1),b(null)}}}return{includePhotos:_,setIncludePhotos:v,photoProgress:y,isExporting:n,error:a,downloadedFile:s,startDate:l,setStartDate:u,endDate:d,setEndDate:f,recordTypes:p,toggleRecordType:g,canExport:h,handleExport:x,closeError:()=>o(null)}}var L,R=t((()=>{L=e(i()),oe(),F(),n()}));function z({exportAction:e}){let{includePhotos:t,setIncludePhotos:n,photoProgress:r,isExporting:i,error:a,downloadedFile:s,startDate:l,setStartDate:d,endDate:p,setEndDate:h,recordTypes:_,toggleRecordType:y,canExport:x,handleExport:S,closeError:C}=se(e);return(0,B.jsxs)(D,{back:{href:m.settingsData,label:A.backToEntry},title:M.title,subtitle:M.subtitle,children:[(0,B.jsxs)(b,{spacing:2.5,children:[(0,B.jsx)(E,{children:(0,B.jsxs)(b,{spacing:1.5,children:[(0,B.jsx)(o,{sx:{fontWeight:700},children:M.scopeTitle}),(0,B.jsx)(o,{variant:`body2`,children:M.dateRange}),(0,B.jsxs)(b,{direction:`row`,spacing:1,children:[(0,B.jsx)(u,{fullWidth:!0,size:`small`,type:`date`,label:M.startDate,value:l,onChange:e=>d(e.target.value),disabled:i,slotProps:{inputLabel:{shrink:!0}}}),(0,B.jsx)(u,{fullWidth:!0,size:`small`,type:`date`,label:M.endDate,value:p,onChange:e=>h(e.target.value),disabled:i,slotProps:{inputLabel:{shrink:!0}}})]}),!l&&!p?(0,B.jsx)(o,{color:`textSecondary`,variant:`body2`,children:M.allDates}):null,(0,B.jsx)(o,{variant:`body2`,children:M.recordTypesTitle}),(0,B.jsx)(b,{direction:`row`,flexWrap:`wrap`,children:[`normal`,`transfer`,`balance_adjustment`].map(e=>(0,B.jsx)(f,{control:(0,B.jsx)(c,{checked:_.includes(e),disabled:i,onChange:()=>y(e)}),label:M.recordTypes[e]},e))}),(0,B.jsx)(o,{color:`textSecondary`,variant:`body2`,children:M.scope})]})}),(0,B.jsx)(E,{children:(0,B.jsxs)(b,{spacing:1,children:[(0,B.jsx)(f,{labelPlacement:`start`,sx:{justifyContent:`space-between`,mx:0},control:(0,B.jsx)(O,{checked:t,disabled:i,onChange:(e,t)=>n(t)}),label:M.includePhotos}),t?(0,B.jsx)(o,{color:`textSecondary`,variant:`body2`,children:M.photoSizeHint}):null]})}),(0,B.jsx)(w,{pending:i,pendingLabel:ee.export,disabled:!x,onClick:S,variant:`contained`,fullWidth:!0,children:M.button}),r?(0,B.jsx)(o,{role:`status`,color:`textSecondary`,variant:`body2`,children:M.photoProgress(r.done,r.total)}):null,s?(0,B.jsx)(g,{severity:`success`,children:M.success(s)}):null]}),(0,B.jsx)(v,{open:a!==null,onClose:C,title:M.failureTitle,description:a})]})}var B,V=t((()=>{B=a(),l(),d(),_(),p(),k(),x(),s(),C(),S(),j(),h(),y(),T(),te(),R(),z.__docgenInfo={description:``,methods:[],displayName:`DataExportTemplate`,props:{exportAction:{required:!0,tsType:{name:`DataExportAction`},description:``}}}})),H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{F(),ie(),V(),{userEvent:H,within:U}=__STORYBOOK_MODULE_TEST__,W=async()=>({data:I()}),G={title:`Templates/Settings/DataExportTemplate`,component:z,args:{exportAction:W}},K=async({canvasElement:e})=>{await H.click(U(e).getByRole(`button`,{name:`导出 Excel`}))},q={name:`默认（可下载示例）`},J={name:`导出照片开关`,play:async({canvasElement:e})=>{await H.click(U(e).getByRole(`switch`,{name:`导出照片`}))}},Y={name:`正在准备照片`,args:{exportAction:async()=>({data:{...I(),photos:[{recordId:`normal`,sortOrder:0,fullUrl:`https://example.com/photo.jpg`}]}})},play:async({canvasElement:e})=>{let t=globalThis.fetch;globalThis.fetch=()=>new Promise(()=>{});try{let t=U(e);await H.click(t.getByRole(`switch`,{name:`导出照片`})),await H.click(t.getByRole(`button`,{name:`导出 Excel`})),await t.findByText(`正在准备照片 0/1`)}finally{globalThis.fetch=t}}},X={name:`导出中`,args:{exportAction:()=>new Promise(()=>{})},play:K},Z={name:`导出失败`,args:{exportAction:async()=>({error:N.exportFailed})},play:K},Q={name:`空账本（可下载表头）`,args:{exportAction:async()=>({data:re()})}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "默认（可下载示例）"
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "导出照片开关",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("switch", {
      name: "导出照片"
    }));
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "正在准备照片",
  args: {
    exportAction: async () => ({
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
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "导出中",
  args: {
    exportAction: () => new Promise(() => {})
  },
  play: startExport
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "导出失败",
  args: {
    exportAction: async () => ({
      error: dataExportErrorMessages.exportFailed
    })
  },
  play: startExport
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "空账本（可下载表头）",
  args: {
    exportAction: async () => ({
      data: createEmptyDataExport()
    })
  }
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`IncludePhotos`,`DownloadingPhotos`,`Exporting`,`Failed`,`Empty`]}))();export{q as Default,Y as DownloadingPhotos,Q as Empty,X as Exporting,Z as Failed,J as IncludePhotos,$ as __namedExportsOrder,G as default};