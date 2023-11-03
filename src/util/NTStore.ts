
import { writable, get as getStore, type Readable } from 'svelte/store';
import { onDestroy } from 'svelte';
import { NT4_Client, NT4_Topic, type TypeString } from './nt4/NT4';
import { checkArrayType } from './util';

enum NTStatus {
    Waiting,
    Connecting,
    Active,
    Error,
    Stopped
  }
class NT {
    nt: NT4_Client | null = null;
    ntSubscribers : Record<string, Map<number, (value:unknown)=>void>> = {};
    connected = writable(false);
    Status = {
        Connected: "Connected",
        Connecting: "Connecting"
    }

    status : NTStatus = NTStatus.Connecting;
    constructor(ip: string) {
        this.connect(ip);
        window.addEventListener("beforeunload", this.disconnect);
    }

    disconnect() {
        this.nt?.disconnect();
    }

    setIP(ip: string) {       
    }

    getKeyMap(key:string) {
        if (!Object.hasOwn(this.ntSubscribers, key)) {
            this.ntSubscribers[key] = new Map<number, (v:unknown)=>void>();
        }
        return this.ntSubscribers[key];
    }
    NTSubscriber<T>(init: T, key: string, topicType: TypeString) : Readable<T> {

        const internal = writable<T>(init);
        console.log("create")
        //let topic = this.nt.createTopic(key, topicType);
        let subuuid = this.getKeyMap(key).set(Math.floor(Math.random() * 99999999), (value)=>{
                internal.set(value as T);
            }
        );
        this.nt?.subscribe([key], false);
       

        const subscribe = internal.subscribe;
        
        // const set = (v) => {
        //     if (!topic.publisher) {
        //         topic.publish();
        //     }
        //     topic.setValue(v);
        //     internal.set(v);
        // };

        const get = ()=>getStore(internal);
        
        //const update = (fn) => set(fn(_val));
        const type = () => topicType;

        // We create our store as a function so that it can be passed as a callback to provide the current value;
        function store() {return get();}
        store.subscribe = subscribe;
        //store.set = set;
        store.get = get;
        //store.update = update;
        store.type = type;
        return store;
    }

    NTPublisher<T>(key: string, topicType: TypeString) : (arg0: T)=>void {
        this.nt?.publishTopic(key, topicType);
        return (val: T) => {
            this.nt?.addSample(key, val);
        }
    }



    IntegerSubscriber(init: number,             key: string){return this.NTSubscriber<number>(init, key, "int") }
    DoubleSubscriber(init: number,          key: string){return this.NTSubscriber<number>(init, key, "double") }
    BooleanSubscriber(init: boolean,        key: string){return this.NTSubscriber<boolean>(init, key, "boolean") }
    StringSubscriber(init: string,          key: string){return this.NTSubscriber<string>(init, key, "string") }
    IntegerArraySubscriber(init: number[],      key: string){return this.NTSubscriber<number[]>(init, key, "int[]") }
    DoubleArraySubscriber(init: number[],   key: string){return this.NTSubscriber<number[]>(init, key, "double[]") }
    BooleanArraySubscriber(init: boolean[], key: string){return this.NTSubscriber<boolean[]>(init, key, "boolean[]") }
    StringArraySubscriber(init: string[],   key: string){return this.NTSubscriber<string[]>(init, key, "string[]")}
    IntegerPublisher(key: string){return this.NTPublisher<number>(key, "int") }
    DoublePublisher(key: string){return this.NTPublisher<number>(key, "double") }
    BooleanPublisher(key: string){return this.NTPublisher<boolean>(key, "boolean") }
    StringPublisher(key: string){return this.NTPublisher<string>(key, "string") }
    IntegerArrayPublisher(key: string){return this.NTPublisher<number[]>(key, "int[]") }
    DoubleArrayPublisher(key: string){return this.NTPublisher<number[]>(key, "double[]") }
    BooleanArrayPublisher(key: string){return this.NTPublisher<boolean[]>(key, "boolean[]") }
    StringArrayPublisher(key: string){return this.NTPublisher<string[]>(key, "string[]") }
    
    connect(address:string) {
    this.nt = new NT4_Client(
        address,
        "AdvantageScope",
        (topic: NT4_Topic) => {
            console.log("announce", topic);
        //   // Announce
        // //   if (!this.log) return;
        // //   if (this.noFieldsTimeout) clearTimeout(this.noFieldsTimeout);
        //   if (topic.name === "") return;
        //   let modifiedKey = this.getKeyFromTopic(topic);
        //   this.log.createBlankField(modifiedKey, this.getLogType(topic.type));
        //   this.log.setWpilibType(modifiedKey, topic.type);
        //   this.shouldRunOutputCallback = true;
        },
        (topic: NT4_Topic) => {
          // Unannounce
        },
        (topic: NT4_Topic, timestamp_us: number, value: unknown) => {
            console.log("data");
          // Data
          if (!this.nt || topic.name === "") return;

          let key = topic.name;
          let timestamp = timestamp_us;

          let updated = false;
          if (Object.hasOwn(this.ntSubscribers, topic.name)){
            const cb = this.ntSubscribers[topic.name];
            switch (topic.type) {
                case "boolean":
                  if (typeof value === "boolean") {
                    updated = true;
                  } else {
                    console.warn('Expected a boolean value for "' + key + '" but got:', value);
                  }
                  break;
                case "int":
                case "float":
                case "double":
                  if (typeof value === "number") {
                    updated = true;
                  } else {
                    console.warn('Expected a number value for "' + key + '" but got:', value);
                  }
                  break;
                case "string":
                  if (typeof value === "string") {
                    updated = true;
                  } else {
                    console.warn('Expected a string value for "' + key + '" but got:', value);
                  }
                  break;
                case "boolean[]":
                  if (checkArrayType(value, "boolean")) {
                    updated = true;
                  } else {
                    console.warn('Expected a boolean[] value for "' + key + '" but got:', value);
                  }
                  break;
                case "int[]":
                case "float[]":
                case "double[]":
                  if (checkArrayType(value, "number")) {
                    updated = true;
                  } else {
                    console.warn('Expected a number[] value for "' + key + '" but got:', value);
                  }
                  break;
                case "string[]":
                  if (checkArrayType(value, "string")) {
                    updated = true;
                  } else {
                    console.warn('Expected a string[] value for "' + key + '" but got:', value);
                  }
                  break;
                case "json":
                  if (typeof value === "string") {
                    //this.log?.putJSON(key, timestamp, value);
                    updated = true;
                  } else {
                    console.warn('Expected a string value for "' + key + '" but got:', value);
                  }
                  break;
                case "msgpack":
                  if (value instanceof Uint8Array) {
                    //this.log?.putMsgpack(key, timestamp, value);
                    updated = true;
                  } else {
                    console.warn('Expected a raw value for "' + key + '" but got:', value);
                  }
                  break;
                default: // Default to raw
                  if (value instanceof Uint8Array) {
                    // if (topic.type.startsWith("struct:")) {
                    //   let schemaType = topic.type.split("struct:")[1];
                    //   if (schemaType.endsWith("[]")) {
                    //     this.log?.putStruct(key, timestamp, value, schemaType.slice(0, -2), true);
                    //   } else {
                    //     this.log?.putStruct(key, timestamp, value, schemaType, false);
                    //   }
                    // } else if (topic.type.startsWith("proto:")) {
                    //   let schemaType = topic.type.split("proto:")[1];
                    //   this.log?.putProto(key, timestamp, value, schemaType);
                    // } else {
                    //   this.log?.putRaw(key, timestamp, value);
                    //   if (CustomSchemas.has(topic.type)) {
                    //     CustomSchemas.get(topic.type)!(this.log, key, timestamp, value);
                    //     this.log.setGeneratedParent(key);
                    //   }
                    // }
                    updated = true;
                  } else {
                    console.warn('Expected a raw value for "' + key + '" but got:', value);
                  }
                  break;
              }
              if (updated) {
                cb.forEach((fn)=>fn(value));
              }
          }
          
        //   if (updated) {
        //     this.shouldRunOutputCallback = true;
        //     this.clearTimestampsBeforeConnection();
        //   }
        },
        () => {
          // Connected
          this.status = NTStatus.Active;
          this.connected.set(true);
        //   if (!this.connectTime && this.nt !== null) {
        //     this.connectTime = this.nt.getClientTime_us();
        //   }
        },
        () => {
          // Disconnected
          this.status = NTStatus.Connecting;
          this.connected.set(false);
          //this.connectTime = null;
        }
      );

      // Start connection
      this.nt.connect();
    }
}

export default new NT("127.0.0.1");