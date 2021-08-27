import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { ApiServiceService } from "../services/api-service.service";
import { TaskDTO } from "../models/TaskDTO.model";
import { parseExpression } from 'cron-parser';
import { scheduleJob } from "../lib/schedule";

@Component({
  selector: 'app-add-task',
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.css']
})
export class AddTaskComponent implements OnInit {

  constructor(private myApiService: ApiServiceService, private datePipe: DatePipe, private modalService: NgbModal) { }

  name: string = "";
  url: string = "";
  typetaskaction: string = "";
  cronexp: string = "";
  timerange: string = "0";
  typetime: string = "";
  clickTimeInput: boolean = true;
  clickCronInput: boolean = false;
  tasks: TaskDTO[] = [];
  closeResult: string = '';

  ngOnInit() {
  }

  save() {

    if (this.checkValidationsFields(this.name, this.url, this.typetaskaction, this.cronexp, this.timerange, this.typetime) == true) {

      let cronExpressionToExecute;
      let dateNextExecution;

      if (this.cronexp.length > 0) {
        cronExpressionToExecute = this.cronexp;
      } else {
        //Enter here if choose timerange
        cronExpressionToExecute = this.validateTimeRange(this.timerange, this.typetime);
      }

      try {
        var interval = parseExpression(cronExpressionToExecute);
        dateNextExecution = this.datePipe.transform(interval.next().toString(), "YYYY-MM-dd HH:mm:ss");
      } catch (err) {
        console.log('Error: ' + err.message);
      }

      let data: TaskDTO = {
        name: this.name,
        url: this.url,
        typetaskaction: this.typetaskaction,
        cronexp: this.cronexp,
        timerange: this.timerange,
        typetime: this.typetime,
        dateExecution: dateNextExecution,
        response: "",
        status: ""
      };

      this.tasks.push(data);
      this.scheduleCron(cronExpressionToExecute, data);
      this.clearFilter();
      document.getElementById("saveButton").blur();

    }

  }

  validateTimeRange(timerange, typetime) {

    var dateFuture = "";

    if (typetime == "Seconds") {
      dateFuture = "0/" + timerange + " * * * * ?";
    }

    if (typetime == "Minutes") {
      dateFuture = "*/" + timerange + " * * * *";
    }

    if (typetime == "Hours") {
      dateFuture = "0 */" + timerange + " * * *";
    }

    if (typetime == "Days") {
      dateFuture = "0 */" + timerange*24 + " * * *";
    }

    return dateFuture;
  }

  checkValidationsFields(name, url, typetaskaction, cronexp, timerange, typetime): boolean {

    if (!this.validateName(name)) {
      return false;
    }

    if (!this.validateURL(url)) {
      return false;
    }

    if (!this.validateTypeTask(typetaskaction)) {
      return false;
    }

    if (!this.validateCronExpressionOrTime(cronexp, timerange, typetime)) {
      return false;
    }

    return true;
  }

  validateName(name): boolean {

    if (name.length <= 0) {
      this.showMessageError("name is required");
      document.getElementById("name").focus();
      return false;
    }

    return true;
  }

  validateURL(url): boolean {

    if (url.length <= 0) {
      this.showMessageError("url is required");
      document.getElementById("url").focus();
      return false;
    }

    return true;
  }

  validateTypeTask(typetaskaction): boolean {

    if (typetaskaction.length <= 0) {
      this.showMessageError("action is required");
      document.getElementById("typetaskaction").focus();
      return false;
    }

    return true;
  }

  validateCronExpressionOrTime(cronexp, timerange, typetime): boolean {

    if (this.clickTimeInput) {
      //Enter here when timerange is disabled

      if (cronexp.length <= 0) {
        this.showMessageError("cron expression is required");
        document.getElementById("cronexp").focus();
        return false;
      }


      try {
        parseExpression(cronexp);
        return true;

      } catch (err) {

        console.log('Error: ' + err.message);
        this.showMessageError("cron expression incorrect. " + err.message);
        document.getElementById("cronexp").focus();
        return false;
      }

    } else {
      //Enter here when timerange is enabled

      if (timerange.length <= 0) {
        this.showMessageError("time range is required");
        document.getElementById("timerange").focus();
        return false;
      }

      if (timerange == "0") {
        this.showMessageError("time range must be non-zero");
        document.getElementById("timerange").focus();
        return false;
      }

      if (typetime.length <= 0) {
        this.showMessageError("time is required");
        document.getElementById("typetime").focus();
        return false;
      }

    }

    return true;
  }

  showMessageError(message) {
    document.getElementById("message").style.color = "red";
    document.getElementById("message").innerHTML = message;

    setTimeout(function () {
      document.getElementById("message").innerHTML = "";
    }, 5000)
  }

  clearFilter() {
    this.name = "";
    this.url = "";
    this.typetaskaction = "";
    this.cronexp = "";
    this.timerange = "0";
    this.typetime = "";
    document.getElementById("clearButton").blur();
  }

  radioClick() {
    this.clickTimeInput = !this.clickTimeInput;
    this.clickCronInput = !this.clickCronInput;

    this.cronexp = "";
    this.timerange = "0";
    this.typetime = "";
  }

  scheduleCron(myCronExpression, task) {

    scheduleJob(myCronExpression, () => {
      var dateNextExecution;
      try {

        var interval = parseExpression(myCronExpression);
        dateNextExecution = this.datePipe.transform(interval.next().toString(), "YYYY-MM-dd HH:mm:ss")
      } catch (err) {
        console.log('Error: ' + err.message);
      }

      this.myApiService.executeGetMethod(task).subscribe(
        response => {

          task.status = response.status;
          task.response = response.response;
        },
        err => console.log(err)
      );
      task.dateExecution = dateNextExecution;
    });

  }

  open(content:any) {
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }
  
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }

}
