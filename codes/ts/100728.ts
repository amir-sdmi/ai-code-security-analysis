import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ServiceProviderService } from './service-provider.service';
import { HttpTestingController } from '@angular/common/http/testing';
import { ServiceProvider } from '../models/service-provider.model';
// Created with ChatGPT

describe('ServiceProviderService', () => {
  let service: ServiceProviderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServiceProviderService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ServiceProviderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch service providers', () => {
    const mockData: ServiceProvider[] = [
      {
        id: 1,
        name: 'Provider One',
        town: '',
        types: [],
      },
      {
        id: 2,
        name: 'Provider Two',
        town: '',
        types: [],
      },
    ];

    const baseURL = 'https://api.example.com/providers';

    service.getServiceProviders(baseURL).subscribe((data) => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne(baseURL);
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
