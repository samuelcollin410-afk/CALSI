import { uid, localISODate } from './utils.js';

export const STATUS_META = {
  notStarted:{label:'Not Started',color:'#8b93a7'},
  working:{label:'Working On',color:'#4c8dff'},
  almost:{label:'Almost Finished',color:'#ffbf47'},
  submitted:{label:'Submitted / Waiting',color:'#9b6cff'},
  completed:{label:'Completed',color:'#43d69c'},
  overdue:{label:'Overdue',color:'#ff5f6d'},
  skipped:{label:'Skipped / Not Doing',color:'#6d7482'}
};

export const TYPE_OPTIONS = ['Assignment','Homework','Quiz','Test','Project','Essay','Presentation','Lab','Reading','Event','Other'];
export const PRIORITIES = ['low','normal','high','urgent'];

export function defaultState(){
  return {
    version:1,
    classes:[
      {id:'general',name:'General',color:'#7c5cff',icon:'📚',teacher:'',room:'',period:'',semester:'Full Year',notes:'',link:''}
    ],
    assignments:[],
    widgets:[
      {id:uid('widget'),type:'note',title:'Quick Notes',content:'Add reminders, ideas, or anything you do not want to turn into an assignment.',size:'wide'},
      {id:uid('widget'),type:'text',title:'This Week',content:'Stay ahead of deadlines and keep the dashboard focused.',size:''}
    ],
    settings:{
      accent:'#7c5cff',
      showGreeting:true,
      showWorkload:true,
      showPoints:true,
      showStats:true,
      showCountdown:true,
      showDailyGoal:true,
      showMiniCalendar:true,
      showWidgets:true,
      showClassIcons:true,
      showConfetti:true,
      showWeekends:true,
      autoOverdue:true,
      importDateDetection:true,
      defaultDateMeaning:'detect',
      archiveDays:21,
      compactCalendar:true,
      enableShortcuts:true,
      enableCommandMenu:true,
      enableNotifications:false,
      classPointTracking:true,
      calendarDefaultView:'month',
      defaultNoTime:'none',
      dashboardEditing:false,
      shortcuts:{new:'n',home:'h',calendar:'c',assignments:'a',search:'/',command:'meta+k'},
      statusColors:Object.fromEntries(Object.entries(STATUS_META).map(([k,v])=>[k,v.color]))
    },
    ui:{route:'home',calendarCursor:localISODate(new Date()).slice(0,7),calendarView:'month',assignmentFilters:{search:'',classId:'all',status:'all',priority:'all',type:'all',sort:'dueSoonest'},settingsSection:'appearance'},
    auth:{user:null,cloudEnabled:false,lastSync:null}
  };
}