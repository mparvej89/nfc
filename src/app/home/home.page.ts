import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiServiceService } from '../api-service.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  loginForm: FormGroup;
  constructor(private api: ApiServiceService, private router:Router) {
    this.loginForm = new FormGroup({
      userName: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });

  }


  get errorControl() {
    return this.loginForm.controls;

  }

  login() {
    this.api.showLoading();
    this.api.login(this.loginForm.value).subscribe((res: any) => {
      this.api.dissMissLoading();
      console.log(res);
      if (res.status == 'success') {
        localStorage.setItem('UserInfo', JSON.stringify(res));
        this.router.navigate(['./dashboard']);
      }
      else {
        this.api.presentToast(res.details);
      }

    }, err => {
      console.log(err);
      this.api.dissMissLoading();

    })
  }

}
