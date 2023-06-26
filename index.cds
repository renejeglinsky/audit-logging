namespace sap.auditlog;

@protocol: 'none'
service AuditLogService {

  action log(event : String, data : LogEntry);
  action logSync(event : String, data : LogEntry);

  event SensitiveDataRead : LogEntry {
    dataSubject : DataSubject;
    dataObject  : DataObject;
    attributes  : many {
      name      : String
    };
  }

  event PersonalDataModified : LogEntry {
    dataSubject : DataSubject;
    dataObject  : DataObject;
    attributes  : many {
      name      : String;
      old       : String;
      new       : String
    };
  };

}

type LogEntry {
  id        : UUID;
  tenant    : String;
  user      : String;
  timestamp : Timestamp;
}

type DataObject {
  type : String;
  id   : {};
}

type DataSubject : DataObject {
  role : String;
}
