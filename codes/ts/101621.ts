import OpenAI from '#lib/open-ai';
import Forecast from '#lib/forecast';
import GoogleMap from '#lib/google-map';
import { Route, Query, Tags, Response, Get } from 'tsoa';

import ServiceClass from '#lib/service-class';

import ForecastDB from '#v1-database/forecast-db';

import { Create } from '#v1-dbInterfaces/forecast';

@Route('/v1/weather')
@Tags('Weather')
class WeatherService extends ServiceClass {
  /**
   * Api gets current forecast in chosen language (default sk) and type (default factual) for given location.
   * If forecast for location is generated, then forecast is returned from MongoDB, otherwise it will be generated, stored and returned.
   */
  @Get('/')
  @Response(401, 'Validation error')
  @Response(400, 'Application error')
  async get(@Query() location: string, @Query() type: 'factual' | 'tabloid', @Query() language: 'sk' | 'en') {
    const interval = this._getInterval();

    let forecast;
    try {
      forecast = await ForecastDB.getByInterval(interval.from, interval.to, location);
    } catch (e: any) {
      throw this.createError('ForecastDBGetByIntervalFailed', 'Failed to call get by interval.', 400, e);
    }

    if (forecast) {
      return { news: forecast[type][language] };
    }

    const mongoObj = await this.generateNews(location, true);

    return { news: mongoObj[type][language] };
  }

  /**
   * Api return historical data in chosen language (default sk) and type (default factual) for given location and date.
   * Forecast should be stored in MongoDB, if not found returns 404.
   */
  @Get('/historical')
  @Response(401, 'Validation error')
  @Response(400, 'Application error')
  @Response(404, 'Not found')
  async getHistorical(
    @Query() location: string,
    @Query() date: Date,
    @Query() type: 'factual' | 'tabloid',
    @Query() language: 'sk' | 'en'
  ) {
    const interval = this._getInterval(date);

    let forecast;
    try {
      forecast = await ForecastDB.getByInterval(interval.from, interval.to, location);
    } catch (e: any) {
      throw this.createError('ForecastDBGetByIntervalFailed', 'Failed to call get by interval.', 400, e);
    }

    if (!forecast) {
      throw this.createError('ForecastDoesNotExist', 'Historical forecast does not exist.', 404);
    }

    return { news: forecast[type][language] };
  }

  async generateNews(location: string, skipCheck = false) {
    const interval = this._getInterval();
    if (skipCheck) {
      let forecast;
      try {
        forecast = await ForecastDB.getByInterval(interval.from, interval.to, location);
      } catch (e: any) {
        throw this.createError('ForecastDBGetByIntervalFailed', 'Failed to call get by interval.', 400, e);
      }

      // If already exists, no needs to generate
      if (forecast) {
        return forecast;
      }
    }

    let coordinates;
    try {
      coordinates = await GoogleMap.getLocationByAddress(location);
    } catch (e: any) {
      throw this.createError('GoogleMapGetLocationByAddressFailed', 'Failed to call get location.', 400, e);
    }

    let forecastData;
    try {
      forecastData = await Forecast.getByLocation(coordinates.lat, coordinates.lng, interval);
    } catch (e: any) {
      throw this.createError('ForecastGetByLocationFailed', 'Failed to call forecast getByLocation.', 400, e);
    }

    // Can't use Promise.all cause chatgpt rate limits
    let skFactual;
    try {
      skFactual = await OpenAI.generateForecast(forecastData, 'factual', 'sk');
    } catch (e: any) {
      throw this.createError('OpenAIGenerateForecastFailed', 'Failed to call forecast getByAddress.', 400, e);
    }

    let enFactual;
    try {
      enFactual = await OpenAI.generateForecast(forecastData, 'factual', 'en');
    } catch (e: any) {
      throw this.createError('OpenAIGenerateForecastFailed', 'Failed to call forecast getByAddress.', 400, e);
    }

    let skTabloid;
    try {
      skTabloid = await OpenAI.generateForecast(forecastData, 'tabloid', 'sk');
    } catch (e: any) {
      throw this.createError('OpenAIGenerateForecastFailed', 'Failed to call forecast getByAddress.', 400, e);
    }

    let enTabloid;
    try {
      enTabloid = await OpenAI.generateForecast(forecastData, 'tabloid', 'en');
    } catch (e: any) {
      throw this.createError('OpenAIGenerateForecastFailed', 'Failed to call forecast getByAddress.', 400, e);
    }

    const mongoObj: Create = {
      factual: {
        sk: skFactual,
        en: enFactual
      },
      tabloid: {
        sk: skTabloid,
        en: enTabloid
      },
      forecastData,
      date: new Date(),
      location
    };

    try {
      await ForecastDB.create(mongoObj);
    } catch (e: any) {
      throw this.createError('ForecastDBCreateFailed', 'Failed to call forecastDB create.', 400, e);
    }

    return mongoObj;
  }

  private _getInterval(date: Date = new Date()) {
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);

    return { from, to };
  }
}

export default new WeatherService('WeatherService');
