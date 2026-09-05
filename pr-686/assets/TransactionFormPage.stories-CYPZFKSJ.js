import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./iframe-DwVQh3Ay.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{S as c,y as l}from"./transactions-CCekvR34.js";import{n as u,t as d}from"./Box-CjwkOWIn.js";import{n as f,t as p}from"./Typography-CwLqrFKa.js";import{a as m,n as h}from"./paths-B1Daueo6.js";import{n as g,t as _}from"./Button-BvhFbL6z.js";import{n as v,t as y}from"./link-Du4AGLbo.js";import{n as ee,t as te}from"./PrimaryActionButton-BcEUdWLa.js";import{i as ne,o as b,r as re}from"./OperationFeedbackDialogs-BAuybcX0.js";import{n as x,t as ie}from"./IconButton-BvjujjMV.js";import{n as ae,o as S,s as oe,t as se}from"./DialogContent-FNdxyCYE.js";import{a as ce,i as C,n as le,t as ue}from"./DialogTitle-CY0oTcSa.js";import{n as de,t as fe}from"./TransactionTypeNavigation-CnOiK4dI.js";import{r as w,t as pe}from"./userThemeCardSx-vnoApgu-.js";import{n as me,t as T}from"./DialogContentText-Cx-akLOS.js";import{n as he,r as ge}from"./ErrorState-C4EaDF2C.js";import{n as _e,t as ve}from"./bottomNavigationLayout-CZtBzE-8.js";import{p as E,t as ye}from"./transaction-BNLpSnjO.js";import{n as be,t as xe}from"./LinkedTransactionSyncConfirmationDialog-BODMWFrf.js";import{n as Se,t as Ce}from"./TransactionAmountKeypadLauncher-Dqk8Uy0D.js";import{n as we,t as Te}from"./ArrowBackRounded-CxlZpNyn.js";import{o as Ee,t as De}from"./TransactionForm.styles-wnvf8rEb.js";import{n as Oe,t as D}from"./TransactionForm-0muAn_-M.js";import{n as ke,t as Ae}from"./EditTransactionDirtyContext-CaDsW0-5.js";import{n as je,t as O}from"./TransferTransactionForm-D8BULZfD.js";import{n as Me,t as Ne}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";function Pe(e){let t=new FormData;for(let[n,r]of e.entries())t.append(n,r);return t}function Fe(e){let t=(0,k.useRef)(null),[n,r]=(0,k.useState)(null),[i,a,o]=(0,k.useActionState)((0,k.useCallback)(async(n,r)=>{let i=await e(n,r);return i.errorKey===E.linkedSyncConfirmationRequired&&(t.current=Pe(r)),i},[e]),{}),s=!!(i!==n&&i.error&&i.errorKey===E.linkedSyncConfirmationRequired),c=!!(i!==n&&i.error&&i.errorKey!==E.linkedSyncConfirmationRequired);function l(){t.current=null,r(i)}function u(){let e=t.current;e&&(e.set(`confirmSync`,`true`),t.current=null,r(i),(0,k.startTransition)(()=>a(e)))}return{cancelConfirmation:l,closeFailure:()=>r(i),confirmSync:u,formAction:a,isConfirmationOpen:s,isFailureOpen:c,isPending:o,state:i}}var k,Ie=t((()=>{k=e(n()),ye()}));function A(e){return`edit-${e}-transaction-form`}function j(e){if(!e)throw Error(`transactionRecordId is required for edit transaction.`);return e}function Le({activeType:e,panels:t}){let n=(0,I.useRef)(null),r=(0,I.useRef)(null),i=(0,I.useRef)(null),[a,o]=(0,I.useState)(null),s=qe.indexOf(e);return(0,I.useLayoutEffect)(()=>{function t(){return e===`expense`?n.current:e===`income`?r.current:i.current}let a=t();if(!a)return;function s(){let e=t();e&&o(e.getBoundingClientRect().height)}if(s(),typeof ResizeObserver>`u`)return;let c=new ResizeObserver(s);return c.observe(a),()=>{c.disconnect()}},[e]),(0,F.jsx)(u,{"data-testid":`transaction-type-slide-panels`,sx:e=>({height:a??`auto`,overflow:`hidden`,transition:e.transitions.create(`height`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:(0,F.jsx)(u,{sx:e=>({alignItems:`flex-start`,display:`flex`,transform:`translateX(-${s*100}%)`,transition:e.transitions.create(`transform`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:qe.map(a=>(0,F.jsx)(u,{ref:a===`expense`?n:a===`income`?r:i,"aria-hidden":a!==e,"data-testid":`transaction-type-slide-panel-${a}`,inert:a===e?void 0:!0,sx:{flex:`0 0 100%`},children:t[a]},a))})})}function Re(e){return(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(ze,{...e}),(0,F.jsx)(Ce,{})]})}function M({operation:e,reason:t=`permission`}){let n=e===`create`?`新增`:`编辑`,r=e===`edit`&&t===`linked`,i=e===`edit`&&t===`archivedAccount`;return(0,F.jsxs)(o,{spacing:2,children:[(0,F.jsx)(N,{title:`${n}记账`}),(0,F.jsx)(he,{title:i||r?`该交易不能编辑`:`无法${n}记账`,description:i?`该交易引用的账户已被删除，请先恢复该账户后再编辑。`:r?`该交易已关联报销或退款，不能编辑。`:`当前账本角色没有${n}记账的权限。`,action:(0,F.jsx)(g,{component:v,href:m.transactions,variant:`outlined`,children:`返回明细`})})]})}function ze({accountOptions:e,action:t,categoryOptions:n,errorMessage:r,frequentCategoryIds:i,initialType:a,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,transactionItemSpecialStatusEnabled:f}){let[p,m]=(0,I.useActionState)(t,{}),h=p.error??r,[g,_]=(0,I.useState)(a??`expense`),v=(0,I.useRef)(a===`income`?`income`:`expense`),[,y]=(0,I.useState)({expense:!0,income:!0,transfer:!0});(0,I.useEffect)(()=>{g!==`transfer`&&(v.current=g)},[g]);function ee(e){if(e===`normal`){_(v.current);return}_(`transfer`)}let te=(0,I.useMemo)(()=>({expense:(0,F.jsx)(D,{action:m,accountOptions:e,categoryOptions:n,errorMessage:h,frequentCategoryIds:i,formId:`new-expense-transaction-form`,hideHeader:!0,initialType:`expense`,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,transactionItemSpecialStatusEnabled:f,onSubmitDisabledChange:e=>y(t=>({...t,expense:e}))}),income:(0,F.jsx)(D,{action:m,accountOptions:e,categoryOptions:n,errorMessage:h,frequentCategoryIds:i,formId:`new-income-transaction-form`,hideHeader:!0,initialType:`income`,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,transactionItemSpecialStatusEnabled:f,onSubmitDisabledChange:e=>y(t=>({...t,income:e}))}),transfer:(0,F.jsx)(O,{action:m,accountOptions:e,errorMessage:h,formId:`new-transfer-transaction-form`,hideHeader:!0,onSubmitDisabledChange:e=>y(t=>({...t,transfer:e}))})}),[m,e,n,i,h,s,c,l,u,d,f]);return(0,F.jsxs)(o,{spacing:0,children:[(0,F.jsx)(N,{title:`记一笔`}),(0,F.jsx)(fe,{activeType:g===`transfer`?`transfer`:`normal`,onChange:ee}),(0,F.jsx)(Le,{activeType:g,panels:te})]})}function N({hasUnsavedChanges:e=!1,onClose:t,title:n}){return(0,F.jsxs)(u,{sx:Xe,children:[e&&t?(0,F.jsx)(x,{"aria-label":`关闭`,onClick:t,sx:Ze,children:(0,F.jsx)(Te,{})}):(0,F.jsx)(x,{"aria-label":`关闭`,component:v,href:m.transactions,sx:Ze,children:(0,F.jsx)(Te,{})}),(0,F.jsx)(f,{component:`h1`,variant:`h5`,sx:Qe,children:n}),(0,F.jsx)(u,{"aria-hidden":!0,sx:{width:40}})]})}function Be({activeType:e,deleteAction:t,hasLinkedIncomeItems:n,isSaveConfirmationOpen:r,isSaveFailureOpen:i,isSavePending:a,onCancelSync:s,onCloseSaveFailure:c,onConfirmSync:l,panels:d,saveErrorMessage:f,setActiveType:p,submitDisabledByType:h,transactionRecordId:_}){let[y,ee]=(0,I.useActionState)(t,{}),[b,x]=(0,I.useState)(!1),[ie,S]=(0,I.useState)(!1),[se,C]=(0,I.useState)(!1),[ue,de]=(0,I.useState)(y),w=(0,I.useRef)(e===`transfer`?`expense`:e),pe=e===`transfer`?`transfer`:`normal`,T=(0,I.useCallback)(()=>x(!0),[]);(0,I.useEffect)(()=>{e!==`transfer`&&(w.current=e)},[e]),(0,I.useEffect)(()=>{if(!b)return;function e(e){e.preventDefault(),e.returnValue=``}return window.addEventListener(`beforeunload`,e),()=>window.removeEventListener(`beforeunload`,e)},[b]);function he(e){T(),p(e===`transfer`?`transfer`:w.current)}function ge(){let t=document.getElementById(A(e))?.closest(`form`);t instanceof HTMLFormElement&&(S(!1),t.requestSubmit())}function _e(){let e=document.getElementById(Je);e instanceof HTMLFormElement&&(C(!1),e.requestSubmit())}return(0,F.jsxs)(Ae,{onDirty:T,children:[(0,F.jsxs)(o,{onChangeCapture:T,spacing:0,children:[(0,F.jsx)(N,{hasUnsavedChanges:b,onClose:()=>S(!0),title:`编辑记账`}),(0,F.jsx)(fe,{activeType:pe,onChange:he}),(0,F.jsx)(Le,{activeType:e,panels:d}),(0,F.jsxs)(u,{sx:$e,children:[(0,F.jsx)(g,{color:`error`,onClick:()=>C(!0),size:`large`,variant:`outlined`,sx:et,children:`删除`}),(0,F.jsx)(te,{disabled:h[e]||a,form:A(e),size:`large`,type:`submit`,sx:Ee,children:`保存修改`})]})]}),(0,F.jsx)(`form`,{action:ee,id:Je,children:(0,F.jsx)(`input`,{name:`transactionRecordId`,readOnly:!0,type:`hidden`,value:_})}),(0,F.jsx)(Ce,{}),(0,F.jsxs)(oe,{"aria-labelledby":`unsaved-transaction-dialog-title`,onClose:()=>S(!1),open:ie,children:[(0,F.jsx)(le,{id:`unsaved-transaction-dialog-title`,children:`尚未保存`}),(0,F.jsx)(ae,{children:(0,F.jsx)(me,{children:`修正的内容尚未保存，是否保存？`})}),(0,F.jsxs)(ce,{children:[(0,F.jsx)(g,{onClick:()=>S(!1),children:`继续编辑`}),(0,F.jsx)(g,{component:v,href:m.transactions,color:`error`,children:`放弃修改`}),(0,F.jsx)(g,{onClick:ge,variant:`contained`,children:`保存`})]})]}),(0,F.jsx)(re,{description:n?`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`:`删除后这笔记账会从明细页移除，是否继续？`,onCancel:()=>C(!1),onConfirm:_e,open:se,title:`删除记账？`}),(0,F.jsx)(xe,{onCancel:()=>{x(!0),s()},onConfirm:l,open:r}),(0,F.jsx)(ne,{bottomOffset:Ye,description:f,onClose:()=>{x(!0),c()},open:i,title:`保存失败`}),(0,F.jsx)(ne,{bottomOffset:Ye,description:y.error,onClose:()=>de(y),open:!!(y.error&&y!==ue),title:y.errorKey===E.linkedDeleteForbidden?`无法删除已关联明细`:`删除失败`})]})}function Ve({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Fe(t),u=i,[d,f]=(0,I.useState)(`transfer`),[p,m]=(0,I.useState)({expense:!0,income:!0,transfer:!0}),h=(0,I.useMemo)(()=>({expense:(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:A(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,F.jsx)(D,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:A(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:We(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:A(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,F.jsx)(D,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:A(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:We(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,F.jsx)(O,{action:l.formAction,accountOptions:e,errorMessage:u,formId:A(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:o,onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:`transfer`})}),[l.formAction,e,n,a,u,o,s,c]);return(0,F.jsx)(Be,{activeType:d,deleteAction:r,hasLinkedIncomeItems:!1,isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:j(o.transactionRecordId)})}function P({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Fe(t),u=i,[d,f]=(0,I.useState)(o.type),[p,m]=(0,I.useState)({expense:!0,income:!0,transfer:!0}),h=(0,I.useMemo)(()=>({expense:(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:A(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,F.jsx)(D,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:A(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:He(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:A(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,F.jsx)(D,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:A(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:He(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,F.jsx)(O,{action:l.formAction,accountOptions:e,errorMessage:u,formId:A(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:Ue(o,e),onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:o.type})}),[l.formAction,e,n,a,u,o,s,c]);return(0,F.jsx)(Be,{activeType:d,deleteAction:r,hasLinkedIncomeItems:o.items.some(e=>e.businessStatus?.incomeLinkRole!=null),isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:j(o.transactionRecordId)})}function He(e,t){return t===e.type?e:{...e,items:[],type:t}}function Ue(e,t){return{accountId:e.accountId,note:e.note,transactionAt:e.transactionAt,transactionRecordId:j(e.transactionRecordId),transferAmount:Ge(e.items,t.find(t=>t.id===e.accountId)?.currency),transferTargetAccountId:Ke(t,e.accountId),type:`transfer`}}function We(e,t){return{accountId:e.accountId,items:[],merchantId:``,note:e.note,transactionAt:e.transactionAt,transactionRecordId:e.transactionRecordId,type:t}}function Ge(e,t){let n=e.reduce((e,t)=>{let n=Number(t.amount);return Number.isFinite(n)?e+n:e},0);return n<=0?``:String(Number(n.toFixed(l(t))))}function Ke(e,t){let n=e.find(e=>e.id===t);return e.find(e=>e.id!==t&&e.currency===n?.currency)?.id??``}var F,I,qe,Je,Ye,Xe,Ze,Qe,$e,et,tt=t((()=>{F=r(),I=e(n()),we(),d(),_(),S(),C(),se(),T(),ue(),ie(),s(),p(),y(),ee(),h(),c(),b(),ge(),_e(),ye(),de(),Se(),ke(),be(),Oe(),De(),je(),i(),Ie(),qe=[`expense`,`income`,`transfer`],Je=`delete-transaction-form`,Ye=`calc(${ve.shellPaddingBottom} + 8px)`,Xe={alignItems:`center`,display:`grid`,gridTemplateColumns:`40px minmax(0, 1fr) 40px`,pb:1.5,pt:{xs:0,sm:.5}},Ze={color:`text.secondary`,justifySelf:`start`,"&:hover":{bgcolor:`action.hover`}},Qe={color:`text.primary`,fontSize:`1rem`,fontWeight:800,letterSpacing:0,lineHeight:1.25,textAlign:`center`},$e={display:`grid`,gap:1.25,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 2fr)`,mt:.25},et={borderRadius:`${a.radius.md}px`,fontSize:`1rem`,fontWeight:800,minHeight:48},Re.__docgenInfo={description:``,methods:[],displayName:`NewTransactionTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},errorMessage:{required:!0,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``},frequentCategoryIds:{required:!0,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``},initialType:{required:!1,tsType:{name:`TransactionRecordType`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionMerchantOption`}],raw:`TransactionMerchantOption[]`},description:``},refundPickerView:{required:!1,tsType:{name:`TransactionTimeGroupViewData`},description:``},loadRefundGroupItemsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  groupKey: string,
  offset: number,
) => Promise<TransactionMonthPage>`,signature:{arguments:[{type:{name:`string`},name:`groupKey`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionMonthPage`}],raw:`Promise<TransactionMonthPage>`}}},description:``},loadRefundMoreGroupsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  offset: number,
) => Promise<TransactionGroupPage>`,signature:{arguments:[{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionGroupPage`}],raw:`Promise<TransactionGroupPage>`}}},description:``},loadRefundSearchPageAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  query: string,
  offset: number,
) => Promise<TransactionSearchPage>`,signature:{arguments:[{type:{name:`string`},name:`query`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionSearchPage`}],raw:`Promise<TransactionSearchPage>`}}},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}},M.__docgenInfo={description:``,methods:[],displayName:`TransactionPermissionDenied`,props:{operation:{required:!0,tsType:{name:`union`,raw:`"edit" | "create"`,elements:[{name:`literal`,value:`"edit"`},{name:`literal`,value:`"create"`}]},description:``},reason:{required:!1,tsType:{name:`union`,raw:`"archivedAccount" | "linked" | "permission"`,elements:[{name:`literal`,value:`"archivedAccount"`},{name:`literal`,value:`"linked"`},{name:`literal`,value:`"permission"`}]},description:``,defaultValue:{value:`"permission"`,computed:!1}}}},Ve.__docgenInfo={description:``,methods:[],displayName:`EditTransferTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransferEditInitialValues`},description:``}}},P.__docgenInfo={description:``,methods:[],displayName:`EditTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``}}}}));function nt({children:e}){return(0,rt.jsx)(u,{"data-testid":`transaction-page-frame`,sx:it,children:e})}var rt,it,at=t((()=>{rt=r(),d(),Me(),i(),pe(),it={color:`text.primary`,display:`flex`,flexDirection:`column`,isolation:`isolate`,marginInline:`auto`,maxWidth:480,minWidth:0,position:`relative`,px:{xs:1.5,sm:2},pb:{xs:2,sm:3},pt:{xs:1,sm:1.5},width:`100%`,"&::before":{...Ne,content:`""`},"& .MuiToggleButtonGroup-root":{bgcolor:`var(--user-theme-segment-bg)`,border:0,borderRadius:`${a.radius.lg}px`,boxShadow:`none`,gap:0,mb:2,p:.375},"& .MuiToggleButton-root":{border:0,borderRadius:`${a.radius.md}px`,color:`var(--user-theme-segment-text)`,fontSize:`0.875rem`,fontWeight:800,minHeight:34,py:.5},"& .MuiToggleButton-root.Mui-selected":{background:`var(--user-theme-fab-bg)`,boxShadow:`var(--user-theme-card-shadow)`,color:`var(--user-theme-fab-text) !important`},"& .MuiToggleButton-root.Mui-selected:hover":{background:`var(--user-theme-fab-bg)`},"& .MuiPaper-outlined":{bgcolor:`var(--user-theme-card-bg)`,...w,borderRadius:`${a.radius.lg}px`,boxShadow:`none`},"& .MuiTextField-root .MuiOutlinedInput-root":{bgcolor:`var(--user-theme-card-bg)`,borderRadius:`${a.radius.md}px`},"& .MuiTextField-root .MuiInputLabel-root":{color:`text.secondary`,fontWeight:700},"& .MuiButton-outlined":{borderColor:`var(--user-theme-field-card-selected-border)`,borderRadius:`${a.radius.md}px`,color:`var(--user-theme-action-text)`,fontWeight:800},"& .MuiButton-contained:not(.Mui-disabled)":{background:`var(--user-theme-fab-bg)`,boxShadow:`0 8px 18px var(--user-theme-fab-shadow)`,color:`var(--user-theme-fab-text)`}},nt.__docgenInfo={description:``,methods:[],displayName:`NewTransactionVisualFrame`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``}}}}));async function L(){return{}}var R,z,B,ot,V,st,H,ct,U,W,G,K,q,J,Y,X,Z,Q,$,lt;t((()=>{R=r(),tt(),at(),{userEvent:z,within:B}=__STORYBOOK_MODULE_TEST__,ot=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],V=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`固定收入`,type:`income`}],st=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`共達`,icon_url:null}],H={accountOptions:ot,action:L,categoryOptions:V,errorMessage:null,frequentCategoryIds:V.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:st,transactionItemSpecialStatusEnabled:!0},ct={title:`Templates/Transactions/TransactionFormPage`,component:Re,decorators:[e=>(0,R.jsx)(nt,{children:(0,R.jsx)(e,{})})],args:H},U={name:`新增记账页面`},W={name:`含错误提示`,args:{errorMessage:`新增记账失败。请稍后重试。`}},G={name:`无新增权限`,render:()=>(0,R.jsx)(M,{operation:`create`})},K={name:`转账账户已归档`,render:()=>(0,R.jsx)(M,{operation:`edit`,reason:`archivedAccount`})},q={name:`无账户和分类选项`,args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},J={name:`编辑支出：可切换到转账`,render:()=>(0,R.jsx)(P,{...H,deleteAction:L,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`普通交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`}})},Y={name:`编辑收入：可切换到转账`,render:()=>(0,R.jsx)(P,{...H,deleteAction:L,initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`260000`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`收入交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`}})},X={name:`编辑记账：转账类型可切换到支出或收入`,render:()=>(0,R.jsx)(Ve,{...H,deleteAction:L,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,note:`转账编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,transferAmount:`5000`,transferTargetAccountId:`00000000-0000-4000-8000-000000000046`,type:`transfer`}})},Z={name:`编辑已关联支出：可编辑并显示核销结余`,render:()=>(0,R.jsx)(P,{...H,deleteAction:L,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessNetAmount:`-300`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1500`},settlementStatus:`reimbursementSurplus`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursementSurplus`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`已有关联但仍可修正`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`,type:`expense`}})},Q={name:`删除仍被子项关联的母项被拒绝`,render:()=>(0,R.jsx)(P,{...H,deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorKey:`linked_delete_forbidden`}),initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursed`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除前需要解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009005`,type:`expense`}}),play:async({canvasElement:e})=>{let t=B(e);await z.click(await t.findByRole(`button`,{name:`删除`})),await z.click(await B(document.body).findByRole(`button`,{name:`删除`})),await B(document.body).findByText(`无法删除已关联明细`)}},$={name:`删除关联收入时提示自动解除关联`,render:()=>(0,R.jsx)(P,{...H,deleteAction:L,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessStatus:{incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},categoryId:`00000000-0000-4000-8000-000000005073`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008002`,specialStatus:null}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除时自动解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009006`,type:`income`}}),play:async({canvasElement:e})=>{let t=B(e);await z.click(await t.findByRole(`button`,{name:`删除`})),await B(document.body).findByText(`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`)}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
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
}`,...$.parameters?.docs?.source}}},lt=[`Default`,`WithError`,`PermissionDenied`,`ArchivedAccountPermissionDenied`,`EmptyOptions`,`EditExpenseConvert`,`EditIncomeConvert`,`EditTransferConvert`,`EditLinkedExpense`,`LinkedDeleteForbidden`,`LinkedIncomeDeleteConfirmation`]}))();export{K as ArchivedAccountPermissionDenied,U as Default,J as EditExpenseConvert,Y as EditIncomeConvert,Z as EditLinkedExpense,X as EditTransferConvert,q as EmptyOptions,Q as LinkedDeleteForbidden,$ as LinkedIncomeDeleteConfirmation,G as PermissionDenied,W as WithError,lt as __namedExportsOrder,ct as default};