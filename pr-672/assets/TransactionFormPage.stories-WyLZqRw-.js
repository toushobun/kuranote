import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./Stack-DRbcmy6F.js";import{S as o,y as s}from"./transactions-CCekvR34.js";import{n as c,t as l}from"./Box-DJ4Y2gCl.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{a as f,n as p}from"./paths-CQl5VVu_.js";import{n as m,t as h}from"./Button-BvhFbL6z.js";import{n as g,t as _}from"./link-Du4AGLbo.js";import{n as v,t as y}from"./PrimaryActionButton-FIyaRBdG.js";import{i as ee,o as b,r as te}from"./OperationFeedbackDialogs-D7mAbZl2.js";import{n as ne,t as x}from"./IconButton-BvjujjMV.js";import{n as re,o as S,s as ie,t as ae}from"./DialogContent-CmMPk5Kg.js";import{a as oe,i as C,n as se,t as ce}from"./DialogTitle-BVWMfc-j.js";import{n as w,t as le}from"./TransactionTypeNavigation-CfVf2ztS.js";import{r as ue,t as de}from"./userThemeCardSx-vnoApgu-.js";import{n as fe,t as pe}from"./DialogContentText-Cx-akLOS.js";import{n as me,r as T}from"./ErrorState-BQFRj0uK.js";import{n as he,t as ge}from"./bottomNavigationLayout-C4JJ80Nd.js";import{p as E,t as D}from"./transaction-BNLpSnjO.js";import{n as _e,t as ve}from"./LinkedTransactionSyncConfirmationDialog-DhjktbcG.js";import{n as ye,t as be}from"./TransactionAmountKeypadLauncher-BzaIeTfs.js";import{n as xe,t as Se}from"./ArrowBackRounded-CxlZpNyn.js";import{o as Ce,t as we}from"./TransactionForm.styles-VrV6DiU6.js";import{n as Te,t as O}from"./TransactionForm--thUIcN1.js";import{n as Ee,t as De}from"./EditTransactionDirtyContext-CaDsW0-5.js";import{n as Oe,t as k}from"./TransferTransactionForm-cj8jqfsX.js";import{n as ke,t as Ae}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";function je(e){let t=new FormData;for(let[n,r]of e.entries())t.append(n,r);return t}function Me(e){let t=(0,A.useRef)(null),[n,r]=(0,A.useState)(null),[i,a,o]=(0,A.useActionState)((0,A.useCallback)(async(n,r)=>{let i=await e(n,r);return i.errorKey===E.linkedSyncConfirmationRequired&&(t.current=je(r)),i},[e]),{}),s=!!(i!==n&&i.error&&i.errorKey===E.linkedSyncConfirmationRequired),c=!!(i!==n&&i.error&&i.errorKey!==E.linkedSyncConfirmationRequired);function l(){t.current=null,r(i)}function u(){let e=t.current;e&&(e.set(`confirmSync`,`true`),t.current=null,r(i),(0,A.startTransition)(()=>a(e)))}return{cancelConfirmation:l,closeFailure:()=>r(i),confirmSync:u,formAction:a,isConfirmationOpen:s,isFailureOpen:c,isPending:o,state:i}}var A,Ne=t((()=>{A=e(n()),D()}));function j(e){return`edit-${e}-transaction-form`}function M(e){if(!e)throw Error(`transactionRecordId is required for edit transaction.`);return e}function Pe({activeType:e,panels:t}){let n=(0,L.useRef)(null),r=(0,L.useRef)(null),i=(0,L.useRef)(null),[a,o]=(0,L.useState)(null),s=We.indexOf(e);return(0,L.useLayoutEffect)(()=>{function t(){return e===`expense`?n.current:e===`income`?r.current:i.current}let a=t();if(!a)return;function s(){let e=t();e&&o(e.getBoundingClientRect().height)}if(s(),typeof ResizeObserver>`u`)return;let c=new ResizeObserver(s);return c.observe(a),()=>{c.disconnect()}},[e]),(0,I.jsx)(c,{"data-testid":`transaction-type-slide-panels`,sx:e=>({height:a??`auto`,overflow:`hidden`,transition:e.transitions.create(`height`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:(0,I.jsx)(c,{sx:e=>({alignItems:`flex-start`,display:`flex`,transform:`translateX(-${s*100}%)`,transition:e.transitions.create(`transform`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:We.map(a=>(0,I.jsx)(c,{ref:a===`expense`?n:a===`income`?r:i,"aria-hidden":a!==e,"data-testid":`transaction-type-slide-panel-${a}`,inert:a===e?void 0:!0,sx:{flex:`0 0 100%`},children:t[a]},a))})})}function Fe(e){return(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(Ie,{...e}),(0,I.jsx)(be,{})]})}function N({operation:e,reason:t=`permission`}){let n=e===`create`?`新增`:`编辑`,r=e===`edit`&&t===`linked`,a=e===`edit`&&t===`archivedAccount`;return(0,I.jsxs)(i,{spacing:2,children:[(0,I.jsx)(P,{title:`${n}记账`}),(0,I.jsx)(me,{title:a||r?`该交易不能编辑`:`无法${n}记账`,description:a?`该交易引用的账户已被删除，请先恢复该账户后再编辑。`:r?`该交易已关联报销或退款，不能编辑。`:`当前账本角色没有${n}记账的权限。`,action:(0,I.jsx)(m,{component:g,href:f.transactions,variant:`outlined`,children:`返回明细`})})]})}function Ie({accountOptions:e,action:t,categoryOptions:n,errorMessage:r,frequentCategoryIds:a,initialType:o,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,transactionItemSpecialStatusEnabled:f}){let[p,m]=(0,L.useActionState)(t,{}),h=p.error??r,[g,_]=(0,L.useState)(o??`expense`),v=(0,L.useRef)(o===`income`?`income`:`expense`),[,y]=(0,L.useState)({expense:!0,income:!0,transfer:!0});(0,L.useEffect)(()=>{g!==`transfer`&&(v.current=g)},[g]);function ee(e){if(e===`normal`){_(v.current);return}_(`transfer`)}let b=(0,L.useMemo)(()=>({expense:(0,I.jsx)(O,{action:m,accountOptions:e,categoryOptions:n,errorMessage:h,frequentCategoryIds:a,formId:`new-expense-transaction-form`,hideHeader:!0,initialType:`expense`,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,transactionItemSpecialStatusEnabled:f,onSubmitDisabledChange:e=>y(t=>({...t,expense:e}))}),income:(0,I.jsx)(O,{action:m,accountOptions:e,categoryOptions:n,errorMessage:h,frequentCategoryIds:a,formId:`new-income-transaction-form`,hideHeader:!0,initialType:`income`,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,transactionItemSpecialStatusEnabled:f,onSubmitDisabledChange:e=>y(t=>({...t,income:e}))}),transfer:(0,I.jsx)(k,{action:m,accountOptions:e,errorMessage:h,formId:`new-transfer-transaction-form`,hideHeader:!0,onSubmitDisabledChange:e=>y(t=>({...t,transfer:e}))})}),[m,e,n,a,h,s,c,l,u,d,f]);return(0,I.jsxs)(i,{spacing:0,children:[(0,I.jsx)(P,{title:`记一笔`}),(0,I.jsx)(le,{activeType:g===`transfer`?`transfer`:`normal`,onChange:ee}),(0,I.jsx)(Pe,{activeType:g,panels:b})]})}function P({hasUnsavedChanges:e=!1,onClose:t,title:n}){return(0,I.jsxs)(c,{sx:qe,children:[e&&t?(0,I.jsx)(ne,{"aria-label":`关闭`,onClick:t,sx:Je,children:(0,I.jsx)(Se,{})}):(0,I.jsx)(ne,{"aria-label":`关闭`,component:g,href:f.transactions,sx:Je,children:(0,I.jsx)(Se,{})}),(0,I.jsx)(u,{component:`h1`,variant:`h5`,sx:Ye,children:n}),(0,I.jsx)(c,{"aria-hidden":!0,sx:{width:40}})]})}function Le({activeType:e,deleteAction:t,hasLinkedIncomeItems:n,isSaveConfirmationOpen:r,isSaveFailureOpen:a,isSavePending:o,onCancelSync:s,onCloseSaveFailure:l,onConfirmSync:u,panels:d,saveErrorMessage:p,setActiveType:h,submitDisabledByType:_,transactionRecordId:v}){let[b,ne]=(0,L.useActionState)(t,{}),[x,S]=(0,L.useState)(!1),[ae,C]=(0,L.useState)(!1),[ce,w]=(0,L.useState)(!1),[ue,de]=(0,L.useState)(b),pe=(0,L.useRef)(e===`transfer`?`expense`:e),me=e===`transfer`?`transfer`:`normal`,T=(0,L.useCallback)(()=>S(!0),[]);(0,L.useEffect)(()=>{e!==`transfer`&&(pe.current=e)},[e]),(0,L.useEffect)(()=>{if(!x)return;function e(e){e.preventDefault(),e.returnValue=``}return window.addEventListener(`beforeunload`,e),()=>window.removeEventListener(`beforeunload`,e)},[x]);function he(e){T(),h(e===`transfer`?`transfer`:pe.current)}function ge(){let t=document.getElementById(j(e))?.closest(`form`);t instanceof HTMLFormElement&&(C(!1),t.requestSubmit())}function D(){let e=document.getElementById(Ge);e instanceof HTMLFormElement&&(w(!1),e.requestSubmit())}return(0,I.jsxs)(De,{onDirty:T,children:[(0,I.jsxs)(i,{onChangeCapture:T,spacing:0,children:[(0,I.jsx)(P,{hasUnsavedChanges:x,onClose:()=>C(!0),title:`编辑记账`}),(0,I.jsx)(le,{activeType:me,onChange:he}),(0,I.jsx)(Pe,{activeType:e,panels:d}),(0,I.jsxs)(c,{sx:Xe,children:[(0,I.jsx)(m,{color:`error`,onClick:()=>w(!0),size:`large`,variant:`outlined`,sx:Ze,children:`删除`}),(0,I.jsx)(y,{disabled:_[e]||o,form:j(e),size:`large`,type:`submit`,sx:Ce,children:`保存修改`})]})]}),(0,I.jsx)(`form`,{action:ne,id:Ge,children:(0,I.jsx)(`input`,{name:`transactionRecordId`,readOnly:!0,type:`hidden`,value:v})}),(0,I.jsx)(be,{}),(0,I.jsxs)(ie,{"aria-labelledby":`unsaved-transaction-dialog-title`,onClose:()=>C(!1),open:ae,children:[(0,I.jsx)(se,{id:`unsaved-transaction-dialog-title`,children:`尚未保存`}),(0,I.jsx)(re,{children:(0,I.jsx)(fe,{children:`修正的内容尚未保存，是否保存？`})}),(0,I.jsxs)(oe,{children:[(0,I.jsx)(m,{onClick:()=>C(!1),children:`继续编辑`}),(0,I.jsx)(m,{component:g,href:f.transactions,color:`error`,children:`放弃修改`}),(0,I.jsx)(m,{onClick:ge,variant:`contained`,children:`保存`})]})]}),(0,I.jsx)(te,{description:n?`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`:`删除后这笔记账会从明细页移除，是否继续？`,onCancel:()=>w(!1),onConfirm:D,open:ce,title:`删除记账？`}),(0,I.jsx)(ve,{onCancel:()=>{S(!0),s()},onConfirm:u,open:r}),(0,I.jsx)(ee,{bottomOffset:Ke,description:p,onClose:()=>{S(!0),l()},open:a,title:`保存失败`}),(0,I.jsx)(ee,{bottomOffset:Ke,description:b.error,onClose:()=>de(b),open:!!(b.error&&b!==ue),title:b.errorKey===E.linkedDeleteForbidden?`无法删除已关联明细`:`删除失败`})]})}function Re({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Me(t),u=i,[d,f]=(0,L.useState)(`transfer`),[p,m]=(0,L.useState)({expense:!0,income:!0,transfer:!0}),h=(0,L.useMemo)(()=>({expense:(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:j(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,I.jsx)(O,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:j(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:Ve(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:j(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,I.jsx)(O,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:j(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:Ve(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,I.jsx)(k,{action:l.formAction,accountOptions:e,errorMessage:u,formId:j(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:o,onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:`transfer`})}),[l.formAction,e,n,a,u,o,s,c]);return(0,I.jsx)(Le,{activeType:d,deleteAction:r,hasLinkedIncomeItems:!1,isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:M(o.transactionRecordId)})}function F({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Me(t),u=i,[d,f]=(0,L.useState)(o.type),[p,m]=(0,L.useState)({expense:!0,income:!0,transfer:!0}),h=(0,L.useMemo)(()=>({expense:(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:j(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,I.jsx)(O,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:j(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:ze(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:j(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,I.jsx)(O,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:j(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:ze(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,I.jsx)(k,{action:l.formAction,accountOptions:e,errorMessage:u,formId:j(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:Be(o,e),onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:o.type})}),[l.formAction,e,n,a,u,o,s,c]);return(0,I.jsx)(Le,{activeType:d,deleteAction:r,hasLinkedIncomeItems:o.items.some(e=>e.businessStatus?.incomeLinkRole!=null),isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:M(o.transactionRecordId)})}function ze(e,t){return t===e.type?e:{...e,items:[],type:t}}function Be(e,t){return{accountId:e.accountId,note:e.note,transactionAt:e.transactionAt,transactionRecordId:M(e.transactionRecordId),transferAmount:He(e.items,t.find(t=>t.id===e.accountId)?.currency),transferTargetAccountId:Ue(t,e.accountId),type:`transfer`}}function Ve(e,t){return{accountId:e.accountId,items:[],merchantId:``,note:e.note,transactionAt:e.transactionAt,transactionRecordId:e.transactionRecordId,type:t}}function He(e,t){let n=e.reduce((e,t)=>{let n=Number(t.amount);return Number.isFinite(n)?e+n:e},0);return n<=0?``:String(Number(n.toFixed(s(t))))}function Ue(e,t){let n=e.find(e=>e.id===t);return e.find(e=>e.id!==t&&e.currency===n?.currency)?.id??``}var I,L,We,Ge,Ke,qe,Je,Ye,Xe,Ze,Qe=t((()=>{I=r(),L=e(n()),xe(),l(),h(),S(),C(),ae(),pe(),ce(),x(),a(),d(),_(),v(),p(),o(),b(),T(),he(),D(),w(),ye(),Ee(),_e(),Te(),we(),Oe(),Ne(),We=[`expense`,`income`,`transfer`],Ge=`delete-transaction-form`,Ke=`calc(${ge.shellPaddingBottom} + 8px)`,qe={alignItems:`center`,display:`grid`,gridTemplateColumns:`40px minmax(0, 1fr) 40px`,pb:1.5,pt:{xs:0,sm:.5}},Je={color:`text.secondary`,justifySelf:`start`,"&:hover":{bgcolor:`action.hover`}},Ye={color:`text.primary`,fontSize:`1rem`,fontWeight:800,letterSpacing:0,lineHeight:1.25,textAlign:`center`},Xe={display:`grid`,gap:1.25,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 2fr)`,mt:.25},Ze={borderRadius:1.75,fontSize:`1rem`,fontWeight:800,minHeight:48},Fe.__docgenInfo={description:``,methods:[],displayName:`NewTransactionTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},errorMessage:{required:!0,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``},frequentCategoryIds:{required:!0,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``},initialType:{required:!1,tsType:{name:`TransactionRecordType`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionMerchantOption`}],raw:`TransactionMerchantOption[]`},description:``},refundPickerView:{required:!1,tsType:{name:`TransactionTimeGroupViewData`},description:``},loadRefundGroupItemsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  groupKey: string,
  offset: number,
) => Promise<TransactionMonthPage>`,signature:{arguments:[{type:{name:`string`},name:`groupKey`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionMonthPage`}],raw:`Promise<TransactionMonthPage>`}}},description:``},loadRefundMoreGroupsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  offset: number,
) => Promise<TransactionGroupPage>`,signature:{arguments:[{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionGroupPage`}],raw:`Promise<TransactionGroupPage>`}}},description:``},loadRefundSearchPageAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  query: string,
  offset: number,
) => Promise<TransactionSearchPage>`,signature:{arguments:[{type:{name:`string`},name:`query`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionSearchPage`}],raw:`Promise<TransactionSearchPage>`}}},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}},N.__docgenInfo={description:``,methods:[],displayName:`TransactionPermissionDenied`,props:{operation:{required:!0,tsType:{name:`union`,raw:`"edit" | "create"`,elements:[{name:`literal`,value:`"edit"`},{name:`literal`,value:`"create"`}]},description:``},reason:{required:!1,tsType:{name:`union`,raw:`"archivedAccount" | "linked" | "permission"`,elements:[{name:`literal`,value:`"archivedAccount"`},{name:`literal`,value:`"linked"`},{name:`literal`,value:`"permission"`}]},description:``,defaultValue:{value:`"permission"`,computed:!1}}}},Re.__docgenInfo={description:``,methods:[],displayName:`EditTransferTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransferEditInitialValues`},description:``}}},F.__docgenInfo={description:``,methods:[],displayName:`EditTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``}}}}));function $e({children:e}){return(0,et.jsx)(c,{"data-testid":`transaction-page-frame`,sx:tt,children:e})}var et,tt,nt=t((()=>{et=r(),l(),ke(),de(),tt={color:`text.primary`,display:`flex`,flexDirection:`column`,isolation:`isolate`,marginInline:`auto`,maxWidth:480,minWidth:0,position:`relative`,px:{xs:1.5,sm:2},pb:{xs:2,sm:3},pt:{xs:1,sm:1.5},width:`100%`,"&::before":{...Ae,content:`""`},"& .MuiToggleButtonGroup-root":{bgcolor:`var(--user-theme-segment-bg)`,border:0,borderRadius:2.5,boxShadow:`none`,gap:0,mb:2,p:.375},"& .MuiToggleButton-root":{border:0,borderRadius:2.25,color:`var(--user-theme-segment-text)`,fontSize:`0.875rem`,fontWeight:800,minHeight:34,py:.5},"& .MuiToggleButton-root.Mui-selected":{background:`var(--user-theme-fab-bg)`,boxShadow:`var(--user-theme-card-shadow)`,color:`var(--user-theme-fab-text) !important`},"& .MuiToggleButton-root.Mui-selected:hover":{background:`var(--user-theme-fab-bg)`},"& .MuiPaper-outlined":{bgcolor:`var(--user-theme-card-bg)`,...ue,borderRadius:1.25,boxShadow:`none`},"& .MuiTextField-root .MuiOutlinedInput-root":{bgcolor:`var(--user-theme-card-bg)`,borderRadius:1.25},"& .MuiTextField-root .MuiInputLabel-root":{color:`text.secondary`,fontWeight:700},"& .MuiButton-outlined":{borderColor:`var(--user-theme-field-card-selected-border)`,borderRadius:1.25,color:`var(--user-theme-action-text)`,fontWeight:800},"& .MuiButton-contained:not(.Mui-disabled)":{background:`var(--user-theme-fab-bg)`,boxShadow:`0 8px 18px var(--user-theme-fab-shadow)`,color:`var(--user-theme-fab-text)`}},$e.__docgenInfo={description:``,methods:[],displayName:`NewTransactionVisualFrame`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``}}}}));async function R(){return{}}var z,B,V,rt,it,at,H,ot,U,W,G,K,q,J,Y,X,Z,Q,$,st;t((()=>{z=r(),Qe(),nt(),{userEvent:B,within:V}=__STORYBOOK_MODULE_TEST__,rt=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],it=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`固定收入`,type:`income`}],at=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`共達`,icon_url:null}],H={accountOptions:rt,action:R,categoryOptions:it,errorMessage:null,frequentCategoryIds:it.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:at,transactionItemSpecialStatusEnabled:!0},ot={title:`Templates/Transactions/TransactionFormPage`,component:Fe,decorators:[e=>(0,z.jsx)($e,{children:(0,z.jsx)(e,{})})],args:H},U={name:`新增记账页面`},W={name:`含错误提示`,args:{errorMessage:`新增记账失败。请稍后重试。`}},G={name:`无新增权限`,render:()=>(0,z.jsx)(N,{operation:`create`})},K={name:`转账账户已归档`,render:()=>(0,z.jsx)(N,{operation:`edit`,reason:`archivedAccount`})},q={name:`无账户和分类选项`,args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},J={name:`编辑支出：可切换到转账`,render:()=>(0,z.jsx)(F,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`普通交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`}})},Y={name:`编辑收入：可切换到转账`,render:()=>(0,z.jsx)(F,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`260000`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`收入交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`}})},X={name:`编辑记账：转账类型可切换到支出或收入`,render:()=>(0,z.jsx)(Re,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,note:`转账编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,transferAmount:`5000`,transferTargetAccountId:`00000000-0000-4000-8000-000000000046`,type:`transfer`}})},Z={name:`编辑已关联支出：可编辑并显示核销结余`,render:()=>(0,z.jsx)(F,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessNetAmount:`-300`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1500`},settlementStatus:`reimbursementSurplus`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursementSurplus`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`已有关联但仍可修正`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`,type:`expense`}})},Q={name:`删除仍被子项关联的母项被拒绝`,render:()=>(0,z.jsx)(F,{...H,deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorKey:`linked_delete_forbidden`}),initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursed`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除前需要解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009005`,type:`expense`}}),play:async({canvasElement:e})=>{let t=V(e);await B.click(await t.findByRole(`button`,{name:`删除`})),await B.click(await V(document.body).findByRole(`button`,{name:`删除`})),await V(document.body).findByText(`无法删除已关联明细`)}},$={name:`删除关联收入时提示自动解除关联`,render:()=>(0,z.jsx)(F,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessStatus:{incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},categoryId:`00000000-0000-4000-8000-000000005073`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008002`,specialStatus:null}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除时自动解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009006`,type:`income`}}),play:async({canvasElement:e})=>{let t=V(e);await B.click(await t.findByRole(`button`,{name:`删除`})),await V(document.body).findByText(`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`)}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "新增记账页面"
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "含错误提示",
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "无新增权限",
  render: () => <TransactionPermissionDenied operation="create" />
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "转账账户已归档",
  render: () => <TransactionPermissionDenied operation="edit" reason="archivedAccount" />
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "无账户和分类选项",
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "编辑支出：可切换到转账",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      categoryId: "00000000-0000-4000-8000-000000005072"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "普通交易编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009001",
    type: "expense"
  }} />
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "编辑收入：可切换到转账",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000046",
    items: [{
      amount: "260000",
      categoryId: "00000000-0000-4000-8000-000000005073"
    }],
    merchantId: "00000000-0000-4000-8000-000000001002",
    note: "收入交易编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009002",
    type: "income"
  }} />
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "编辑记账：转账类型可切换到支出或收入",
  render: () => <EditTransferTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    note: "转账编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009003",
    transferAmount: "5000",
    transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
    type: "transfer"
  }} />
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "编辑已关联支出：可编辑并显示核销结余",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessNetAmount: "-300",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "1500"
        },
        settlementStatus: "reimbursementSurplus"
      },
      categoryId: "00000000-0000-4000-8000-000000005072",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      specialStatus: "reimbursementSurplus"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "已有关联但仍可修正",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009004",
    type: "expense"
  }} />
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "删除仍被子项关联的母项被拒绝",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={async () => ({
    error: "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
    errorKey: "linked_delete_forbidden"
  })} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "1200"
        },
        settlementStatus: "reimbursed"
      },
      categoryId: "00000000-0000-4000-8000-000000005072",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      specialStatus: "reimbursed"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "删除前需要解除关联",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009005",
    type: "expense"
  }} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("无法删除已关联明细");
  }
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  name: "删除关联收入时提示自动解除关联",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessStatus: {
        incomeLinkRole: "reimbursement",
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "0"
        },
        settlementStatus: null
      },
      categoryId: "00000000-0000-4000-8000-000000005073",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008002",
      specialStatus: null
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "删除时自动解除关联",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009006",
    type: "income"
  }} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？");
  }
}`,...$.parameters?.docs?.source}}},st=[`Default`,`WithError`,`PermissionDenied`,`ArchivedAccountPermissionDenied`,`EmptyOptions`,`EditExpenseConvert`,`EditIncomeConvert`,`EditTransferConvert`,`EditLinkedExpense`,`LinkedDeleteForbidden`,`LinkedIncomeDeleteConfirmation`]}))();export{K as ArchivedAccountPermissionDenied,U as Default,J as EditExpenseConvert,Y as EditIncomeConvert,Z as EditLinkedExpense,X as EditTransferConvert,q as EmptyOptions,Q as LinkedDeleteForbidden,$ as LinkedIncomeDeleteConfirmation,G as PermissionDenied,W as WithError,st as __namedExportsOrder,ot as default};